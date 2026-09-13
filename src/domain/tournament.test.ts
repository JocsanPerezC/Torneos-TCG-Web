import { describe, expect, it } from 'vitest'
import { tableSizes } from './tableSizes'
import { makePairings } from './pairing'
import { isValidPodResult, standings } from './scoring'
import type { Player, Tournament } from './types'

const players = (count:number): Player[] => Array.from({length:count},(_,index)=>({id:`p${index}`,name:`P${index}`,active:true,tieBreaker:index}))
describe('distribución de mesas', () => {
  it.each([[1,[1]],[2,[2]],[3,[3]],[4,[4]],[5,[5]],[6,[3,3]],[7,[4,3]],[8,[4,4]],[9,[3,3,3]],[10,[4,3,3]],[11,[4,4,3]],[12,[4,4,4]],[13,[4,3,3,3]],[18,[4,4,4,3,3]]])('asigna %i como %j', (count,expected) => expect(tableSizes(count)).toEqual(expected))
  it('rechaza cero jugadores', () => expect(()=>tableSizes(0)).toThrow('un jugador'))
  it('asigna cada jugador una sola vez y mesas válidas', () => { const groups=makePairings(players(14),[],{},42); expect(groups.flat()).toHaveLength(14); expect(new Set(groups.flat()).size).toBe(14); expect(groups.every(group=>group.length>=3&&group.length<=4)).toBe(true) })
  it('reduce enfrentamientos repetidos donde hay alternativa', () => { const prior = [{id:'r1',number:1,status:'completada' as const,seed:1,pods:[{id:'x',number:1,playerIds:['p0','p1','p2'],},{id:'y',number:2,playerIds:['p3','p4','p5']}]}]; const groups=makePairings(players(6),prior,{},10); expect(groups.some(group=>group.includes('p0')&&group.includes('p1')&&group.includes('p2'))).toBe(false) })
})
describe('puntos y desempates', () => { const base = ():Tournament => ({id:'t',ownerId:'o',name:'T',format:'Commander',plannedRounds:1,status:'activo',isPublic:false,publicSlug:'x',createdAt:'',scoring:{first:5,second:3,third:1,fourth:0,tie:3},players:players(3),rounds:[{id:'r',number:1,status:'completada',seed:1,pods:[{id:'pod',number:1,playerIds:['p0','p1','p2'],resultType:'normal',results:[{playerId:'p0',position:1,kills:1},{playerId:'p1',position:2,kills:2},{playerId:'p2',position:3,kills:0}]}]}]})
  it('usa puntuación normal configurable y orden estable',()=>{const rows=standings(base()); expect(rows.map(r=>r.points)).toEqual([5,3,1]); expect(rows[0].player.id).toBe('p0')})
  it('usa las posiciones editables también para una victoria por combo',()=>{const t=base(); t.rounds[0].pods[0].resultType='combo'; expect(standings(t).map(r=>r.points)).toEqual([5,3,1])})
  it('asigna los puntos configurados a cada persona viva en un empate',()=>{const t=base(); t.scoring.tie=4; const pod=t.rounds[0].pods[0]; pod.resultType='empate'; pod.results!.forEach(result=>result.position=1); pod.results![2].dead=true; expect(isValidPodResult(pod)).toBe(true); expect(standings(t).map(row=>row.points)).toEqual([4,4,0]); expect(standings(t).map(row=>row.wins)).toEqual([0,0,0])})
  it('usa 5, 4, 3, 2 y 1 para una mesa de cinco',()=>{const t=base(); t.players=players(5); const pod={...t.rounds[0].pods[0],playerIds:['p0','p1','p2','p3','p4'],results:[0,1,2,3,4].map(index=>({playerId:`p${index}`,position:index+1,kills:0}))}; t.rounds[0].pods=[pod]; expect(standings(t).map(row=>row.points)).toEqual([5,4,3,2,1])})
  it('permite posiciones repetidas salvo el primer lugar',()=>{const pod=base().rounds[0].pods[0]; pod.results![2].position=2; expect(isValidPodResult(pod)).toBe(true); pod.results![1].position=1; expect(isValidPodResult(pod)).toBe(false)})
  it('recalcula al cambiar reglas o resultado',()=>{const t=base(); t.scoring.first=1; expect(standings(t)[0].player.id).toBe('p1'); t.rounds[0].pods[0].results![1].position=1; t.rounds[0].pods[0].results![0].position=2; expect(standings(t)[0].player.id).toBe('p0')})
})
