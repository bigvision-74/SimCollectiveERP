export interface Observation {
    id?: number;
    patient_id?: number;
    created_at: any;
    respiratoryRate: string;
    o2Sats: string;
    spo2Scale: string;
    oxygenDelivery: string;
    bloodPressure: string;
    pulse: string;
    consciousness: string;
    temperature: string;
    news2Score: string;
}
