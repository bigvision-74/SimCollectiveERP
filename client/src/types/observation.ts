export interface Observation {
    id?: number;
    patient_id?: number;
    created_at: any;
    respiratoryRate: string;
    o2Sats: string;
    oxygenDelivery: string;
    bloodPressure: string;
    pulse: string;
    gcs: string;
    temperature: string;
    news2Score: string;
    mews2: string;
    pews2: string;
    observer_fname?: string;
    observer_lname?: string;
    time_stamp?: any;
}
