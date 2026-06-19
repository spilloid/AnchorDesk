import { ManageAPI } from 'connectwise-rest';
import { config } from '../config/config';

let _cwm: ManageAPI | null = null;

export function getCwm(): ManageAPI {
  if (!_cwm) {
    if (!config.cwm.company || !config.cwm.server || !config.cwm.publicKey || !config.cwm.privateKey || !config.cwm.clientId) {
      throw new Error('ConnectWise Manage credentials are not configured (CWM_* env vars missing)');
    }
    _cwm = new ManageAPI({
      companyId: config.cwm.company,
      companyUrl: config.cwm.server,
      publicKey: config.cwm.publicKey,
      privateKey: config.cwm.privateKey,
      clientId: config.cwm.clientId,
      entryPoint: 'v4_6_release',
      apiVersion: '3.0.0',
      timeout: 20000,
      retry: false,
      retryOptions: {
        retries: 4,
        minTimeout: 50,
        maxTimeout: 45000,
        randomize: true,
      },
      debug: false,
    });
  }
  return _cwm;
}

export function cwmConfigured(): boolean {
  return !!(config.cwm.company && config.cwm.server && config.cwm.publicKey && config.cwm.privateKey && config.cwm.clientId);
}
