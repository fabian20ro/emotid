export interface LocalizedText {
  ro: string
  en: string
}

export interface CanonicalEmotionSource {
  id: string
  label: LocalizedText
  description?: LocalizedText
  descriptionStatus?: 'reviewed'
  needs: LocalizedText
  color: string
  distressTier?: 'watch' | 'high'
  parent?: string
  parents?: string[]
}

export interface CanonicalEmotion extends Omit<CanonicalEmotionSource, 'description' | 'descriptionStatus'> {
  description: LocalizedText
  descriptionStatus: 'reviewed' | 'generated'
}
