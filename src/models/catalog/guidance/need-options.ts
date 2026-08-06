import needOptionsData from './need-options.json'
import type { LocalizedText } from '../types'

export type NeedOptionId = keyof typeof needOptionsData

export const needOptions: Readonly<Record<NeedOptionId, LocalizedText>> = needOptionsData

export function getNeedOption(id: string): LocalizedText | undefined {
  return needOptions[id as NeedOptionId]
}
