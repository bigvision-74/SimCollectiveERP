export interface Observation {
    id?: number;
    patient_id?: number;
    created_at: any;
    respiratoryRate: string;
    o2Sats: string;
    oxygenDelivery: string;
    bloodPressure: string;
    pulse: string;
    consciousness: string;
    temperature: string;
    news2Score: string;
    observer_fname?: string;
    observer_lname?: string;
    time_stamp?: any;
}
