import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { CampaignData, DashboardMetrics } from '../types';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DataContextType {
  user: User | null;
  isAuthReady: boolean;
  data: CampaignData[];
  filteredData: CampaignData[];
  metrics: DashboardMetrics;
  filteredMetrics: DashboardMetrics;
  availableMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableYears: number[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isLoading: boolean;
  error: string | null;
}

const defaultMetrics: DashboardMetrics = {
  totalLeadsIngresados: 0,
  totalLeadsAgendados: 0,
  totalNoAsisten: 0,
  totalConvierten: 0,
  totalMontoInvertido: 0,
  costoPromedioPorCliente: 0,
  totalIngresos: 0,
  roas: 0,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [data, setData] = useState<CampaignData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('Enero');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const availableMonths = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Security Check: Authorized emails only
      const ALLOWED_EMAILS = ['jcontreras.ktr@gmail.com', 'mpaine@amipgo.com'];
      
      if (currentUser && currentUser.email && !ALLOWED_EMAILS.includes(currentUser.email)) {
        auth.signOut();
        setError("Acceso denegado: este usuario no está en la lista de administradores autorizados.");
        setUser(null);
        setIsAuthReady(true);
        setData([]);
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setData([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) return;

    setIsLoading(true);
    setError(null);

    const campaignsRef = collection(db, 'campaigns');
    // Important: We fetch all campaigns for authorized users.
    const q = query(campaignsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData: CampaignData[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          mes: d.mes,
          anio: d.anio || new Date().getFullYear(),
          campaign: d.campaign,
          leadsIngresados: d.leadsIngresados || 0,
          leadsAgendados: d.leadsAgendados || 0,
          leadsNoAsisten: d.leadsNoAsisten || 0,
          leadsConvierten: d.leadsConvierten || 0,
          montoInvertido: d.montoInvertido || 0,
          montoPorCliente: d.montoPorCliente || 0,
          ingresos: d.ingresos || 0,
        };
      });
      setData(fetchedData);
      
      // Update selected month if current list is non-empty and selectedMonth isn't in it? 
      // We will keep selectedMonth if it has data or default
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, 'campaigns');
      } catch (err: any) {
        setError(err.message);
      }
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => d.anio));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a,b) => b - a); // Descending
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => d.mes === selectedMonth && d.anio === selectedYear);
  }, [data, selectedMonth, selectedYear]);

  const calculateMetrics = (campaignData: CampaignData[]): DashboardMetrics => {
    let totalLeadsIngresados = 0;
    let totalLeadsAgendados = 0;
    let totalNoAsisten = 0;
    let totalConvierten = 0;
    let totalMontoInvertido = 0;
    let totalIngresos = 0;
    let sumMontoPorCliente = 0;
    let countMontoPorCliente = 0;

    campaignData.forEach(c => {
      totalLeadsIngresados += c.leadsIngresados;
      totalLeadsAgendados += c.leadsAgendados;
      totalNoAsisten += c.leadsNoAsisten;
      totalConvierten += c.leadsConvierten;
      totalMontoInvertido += c.montoInvertido;
      totalIngresos += c.ingresos;
      
      if (c.montoPorCliente > 0) {
        sumMontoPorCliente += c.montoPorCliente;
        countMontoPorCliente++;
      }
    });

    const costoPromedioPorCliente = countMontoPorCliente > 0 
      ? sumMontoPorCliente / countMontoPorCliente 
      : (totalConvierten > 0 ? totalMontoInvertido / totalConvierten : 0);

    const roas = totalMontoInvertido > 0 
      ? totalIngresos / totalMontoInvertido 
      : 0;

    return {
      totalLeadsIngresados,
      totalLeadsAgendados,
      totalNoAsisten,
      totalConvierten,
      totalMontoInvertido,
      costoPromedioPorCliente,
      totalIngresos,
      roas,
    };
  };

  const metrics = useMemo(() => calculateMetrics(data), [data]);
  const filteredMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);

  return (
    <DataContext.Provider value={{ 
      user,
      isAuthReady,
      data, 
      filteredData,
      metrics, 
      filteredMetrics,
      availableMonths,
      selectedMonth,
      setSelectedMonth,
      availableYears,
      selectedYear,
      setSelectedYear,
      isLoading, 
      error
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
