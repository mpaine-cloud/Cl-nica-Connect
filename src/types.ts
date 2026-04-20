export interface CampaignData {
  id?: string;
  mes: string;
  anio: number;
  campaign: string;
  leadsIngresados: number;
  leadsAgendados: number;
  leadsNoAsisten: number;
  leadsConvierten: number;
  montoInvertido: number;
  montoPorCliente: number;
  ingresos: number;
}

export interface DashboardMetrics {
  totalLeadsIngresados: number;
  totalLeadsAgendados: number;
  totalNoAsisten: number;
  totalConvierten: number;
  totalMontoInvertido: number;
  costoPromedioPorCliente: number;
  totalIngresos: number;
  roas: number;
}
