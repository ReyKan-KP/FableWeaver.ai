interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

interface StorageSettings {
  provider: string;
  bucketName: string;
  apiKey?: string;
  region?: string;
  endpoint?: string;
}

export interface SystemSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxUploadSize: number;
  emailSettings: EmailSettings;
  storageSettings: StorageSettings;
  backupFrequency: "hourly" | "daily" | "weekly" | "monthly";
} 