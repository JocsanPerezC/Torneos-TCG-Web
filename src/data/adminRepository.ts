import { supabase } from '../lib/supabase'

export type AppRole = 'organizer' | 'admin' | 'super_admin'
export type AssignableRole = Exclude<AppRole, 'super_admin'>

export type AdminProfile = {
  id: string
  displayName: string
  role: AppRole
  createdAt: string
}

export type AdminTournament = {
  id: string
  name: string
  format: string
  status: string
  isPublic: boolean
  ownerId: string
  createdAt: string
  playerCount: number
  roundCount: number
}

export type AdminOverview = {
  profiles: AdminProfile[]
  tournaments: AdminTournament[]
}

type Row = Record<string, unknown>
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const relatedCount = (value: unknown) => Number(rows(value)[0]?.count ?? 0)

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

export async function loadAdminOverview(): Promise<AdminOverview> {
  const db = client()
  const [profilesResponse, tournamentsResponse] = await Promise.all([
    db.from('profiles').select('id, display_name, role, created_at').order('created_at', { ascending: false }),
    db.from('tournaments').select('id, owner_id, name, format, status, is_public, created_at, players(count), rounds(count)').order('created_at', { ascending: false }),
  ])

  if (profilesResponse.error) throw profilesResponse.error
  if (tournamentsResponse.error) throw tournamentsResponse.error

  return {
    profiles: rows(profilesResponse.data).map(row => ({
      id: String(row.id),
      displayName: String(row.display_name ?? 'Sin nombre'),
      role: row.role === 'super_admin' ? 'super_admin' : row.role === 'admin' ? 'admin' : 'organizer',
      createdAt: String(row.created_at),
    })),
    tournaments: rows(tournamentsResponse.data).map(row => ({
      id: String(row.id),
      ownerId: String(row.owner_id),
      name: String(row.name),
      format: String(row.format),
      status: String(row.status),
      isPublic: Boolean(row.is_public),
      createdAt: String(row.created_at),
      playerCount: relatedCount(row.players),
      roundCount: relatedCount(row.rounds),
    })),
  }
}

export async function updateProfileRole(profileId: string, role: AssignableRole) {
  const { error } = await client().rpc('set_profile_role', { target_profile_id: profileId, next_role: role })
  if (error) throw error
}
