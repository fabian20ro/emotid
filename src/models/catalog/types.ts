export interface LocalizedText {
  ro: string
  en: string
}

export interface CanonicalEmotionSource {
  id: string
  label: LocalizedText
  description?: LocalizedText
  descriptionStatus?: 'reviewed'
  guidance?: {
    status: 'reviewed'
    needId: string | null
  }
  color: string
  distressTier?: 'watch' | 'high'
  parent?: string
  parents?: string[]
}

export interface CanonicalEmotion extends Omit<CanonicalEmotionSource, 'guidance'> {
  needs?: LocalizedText
  needId?: string
  guidanceStatus?: 'reviewed'
}
