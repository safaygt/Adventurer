/**
 * BudgetType Enum
 * 
 * Rotalar için bütçe kategorilerini tanımlar.
 * Schema.prisma'da tanımlı BudgetType enum'u ile uyumludur.
 * - BUDGET: Uygun fiyatlı, bütçe dostu seçenekler
 * - MODERATE: Orta seviye, dengeli seçenekler
 * - LUXURY: Premium, üst düzey seçenekler
 */
export enum BudgetType {
  BUDGET = 'BUDGET',
  MODERATE = 'MODERATE',
  LUXURY = 'LUXURY',
}
