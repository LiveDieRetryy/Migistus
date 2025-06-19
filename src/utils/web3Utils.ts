export class Web3Utils {
  static isMetaMaskAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.isMetaMask;
  }

  static async checkMetaMaskConnection(): Promise<{ connected: boolean; address?: string; error?: string }> {
    try {
      if (!this.isMetaMaskAvailable()) {
        return {
          connected: false,
          error: 'MetaMask extension not found. Please install MetaMask to use wallet features.'
        };
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        return {
          connected: true,
          address: accounts[0]
        };
      } else {
        return {
          connected: false,
          error: 'No MetaMask accounts connected. Please connect your wallet.'
        };
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Failed to check MetaMask connection'
      };
    }
  }

  static async connectMetaMask(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (!this.isMetaMaskAvailable()) {
        return {
          success: false,
          error: 'MetaMask extension not found. Please install MetaMask from https://metamask.io'
        };
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        return {
          success: true,
          address: accounts[0]
        };
      } else {
        return {
          success: false,
          error: 'No accounts returned from MetaMask'
        };
      }
    } catch (error: any) {
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'MetaMask connection was rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'MetaMask connection request is already pending';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static getMetaMaskDownloadUrl(): string {
    return 'https://metamask.io/download/';
  }

  static showMetaMaskNotFoundMessage(): void {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      let installMessage = 'MetaMask browser extension is required for wallet features.';
      
      if (userAgent.includes('chrome')) {
        installMessage += ' Install from Chrome Web Store.';
      } else if (userAgent.includes('firefox')) {
        installMessage += ' Install from Firefox Add-ons.';
      } else if (userAgent.includes('edge')) {
        installMessage += ' Install from Microsoft Edge Add-ons.';
      } else {
        installMessage += ' Visit metamask.io to install.';
      }
      
      console.warn(installMessage);
    }
  }

  // Suppress MetaMask-related errors globally
  static suppressMetaMaskErrors(): void {
    if (typeof window === 'undefined') return;

    // Override console.error to filter MetaMask errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('MetaMask') || 
          message.includes('ethereum') ||
          message.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
        // Silently ignore MetaMask errors
        return;
      }
      originalError.apply(console, args);
    };

    // Handle unhandled promise rejections from MetaMask
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('MetaMask') ||
          event.reason?.message?.includes('ethereum') ||
          event.reason?.stack?.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
        event.preventDefault();
        console.warn('MetaMask error suppressed:', event.reason?.message);
      }
    });

    // Handle general errors from MetaMask extension
    window.addEventListener('error', (event) => {
      if (event.filename?.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          event.message?.includes('MetaMask') ||
          event.message?.includes('ethereum')) {
        event.preventDefault();
        console.warn('MetaMask extension error suppressed:', event.message);
      }
    });
  }
}

// Auto-initialize error suppression when this module loads
if (typeof window !== 'undefined') {
  Web3Utils.suppressMetaMaskErrors();
}
