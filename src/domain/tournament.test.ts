import { describe, expect, it } from 'vitest'
import { tableSizes } from './tableSizes'
import { makePairings } from './pairing'
import { standings } from './scoring'
import type { Player, Tournament } from './types'

const players = (count:number): Player[] => Array.from({length:count},(_,index)=>({id:`p${index}`,name:`P${index}`,active:true,tieBreaker:index}))
describe('distribución de mesas', () => {
  it.each([[6,[3,3]],[7,[4,3]],[8,[4,4]],[9,[3,3,3]],[10,[4,3,3]],[11,[4,4,3]],[12,[4,4,4]],[13,[4,3,3,3]],[18,[4,4,4,3,3]]])('asigna %i como %j', (count,expected) => expect(tableSizes(count)).toEqual(expected))
  it('rechaza menos de seis', () => expect(()=>tableSizes(5)).toThrow('seis'))
  it('asigna cada jugador una sola vez y mesas válidas', () => { const groups=makePairings(players(14),[],{},42); expect(groups.flat()).toHaveLength(14); expect(new Set(groups.flat()).size).toBe(14); expect(groups.every(group=>group.length>=3&&group.length<=4)).toBe(true) })
  it('reduce enfrentamientos repetidos donde hay alternativa', () => { const prior = [{id:'r1',number:1,status:'completada' as const,seed:1,pods:[{id:'x',number:1,playerIds:['p0','p1','p2'],},{id:'y',number:2,playerIds:['p3','p4','p5']}]}]; const groups=makePairings(players(6),prior,{},10); expect(groups.some(group=>group.includes('p0')&&group.includes('p1')&&group.includes('p2'))).toBe(false) })
})
describe('puntos y desempates', () => { const base = ():Tournament => ({id:'t',ownerId:'o',name:'T',format:'Commander',plannedRounds:1,status:'activo',isPublic:false,publicSlug:'x',createdAt:'',scoring:{first:5,second:3,third:1,fourth:0,comboWinner:7,comboOther:2},players:players(3),rounds:[{id:'r',number:1,status:'completada',seed:1,pods:[{id:'pod',number:1,playerIds:['p0','p1','p2'],resultType:'normal',results:[{playerId:'p0',position:1,kills:1},{playerId:'p1',position:2,kills:2},{playerId:'p2',position:3,kills:0}]}]}]})
  it('usa puntuación normal configurable y orden estable',()=>{const rows=standings(base()); expect(rows.map(r=>r.points)).toEqual([5,3,1]); expect(rows[0].player.id).toBe('p0')})
  it('usa puntuación de combo',()=>{const t=base(); t.rounds[0].pods[0].resultType='combo'; expect(standings(t).map(r=>r.points)).toEqual([7,2,2])})
  it('recalcula al cambiar reglas o resultado',()=>{const t=base(); t.scoring.first=1; expect(standings(t)[0].player.id).toBe('p1'); t.rounds[0].pods[0].results![1].position=1; t.rounds[0].pods[0].results![0].position=2; expect(standings(t)[0].player.id).toBe('p0')})
})
