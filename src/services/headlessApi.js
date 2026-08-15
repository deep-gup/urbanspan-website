import axios from 'axios';

export const getDynamicBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const isNative = (window.Capacitor && window.Capacitor.isNative) || window.location.protocol === 'capacitor:';
    const savedIp = localStorage.getItem('DEV_SERVER_IP');

    if (isNative) {
      if (import.meta.env.PROD) {
        return 'https://api.urbanspaninfra.co.in';
      }
      return `http://${savedIp || '192.168.29.63'}:5000`;
    }

    const host = window.location.hostname;
    if (host && host.includes('urbanspaninfra.co.in')) {
      return 'https://api.urbanspaninfra.co.in';
    }

    if (import.meta.env.PROD) {
      return 'https://api.urbanspaninfra.co.in';
    }

    if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('run.app')) {
      return `http://${host}:5000`;
    }

    if (savedIp) {
      return `http://${savedIp}:5000`;
    }
  }
  return import.meta.env.VITE_API_URL || 'https://api.urbanspaninfra.co.in';
};

const DEFAULT_CONFIG = {
  apiBaseUrl: getDynamicBackendUrl(),
  apiKey: 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f',
  orgCode: 'urbanspan_steel_1764'
};

export const getStoredConfig = () => {
  const dynamicUrl = getDynamicBackendUrl();
  const saved = localStorage.getItem('urbanspan_api_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.orgCode) {
        let changed = false;
        if (parsed.apiBaseUrl !== dynamicUrl) {
          parsed.apiBaseUrl = dynamicUrl;
          changed = true;
        }

        if (parsed.orgCode === 'org_urbanspan_steel_1784961367443' || parsed.orgCode === 'org_urbanspan_steel_1785673557358') {
          parsed.orgCode = 'urbanspan_steel_1764';
          changed = true;
        }
        if (changed) {
          localStorage.setItem('urbanspan_api_config', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {}
  }
  return { ...DEFAULT_CONFIG, apiBaseUrl: dynamicUrl };
};

export const saveStoredConfig = (config) => {
  localStorage.setItem('urbanspan_api_config', JSON.stringify(config));
};

const createApiClient = () => {
  const config = getStoredConfig();
  return axios.create({
    baseURL: `${config.apiBaseUrl}/api`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'x-org-code': config.orgCode
    }
  });
};

// Fallback Steel Products Catalog
const MOCK_STEEL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)',
    sku: 'US-TMT-550D',
    category: 'Rebars',
    base_price: 54500.00,
    description: 'High tensile earthquake-resistant TMT rebars adhering to IS 1786:2008 specifications for heavy infrastructure & high-rise construction.',
    image_url: '/images/tmt_rebars.jpg',
    specs: { Grade: 'Fe-550D', Standard: 'IS 1786:2008', YieldStrength: '550 N/mm²', Ductility: 'High (D-Grade)' }
  },
  {
    id: 'p2',
    name: 'Heavy Structural ISMB I-Beams & Columns',
    sku: 'US-STR-ISMB',
    category: 'Structural Steel',
    base_price: 58200.00,
    description: 'Primary structural steel sections (ISMB 100 to ISMB 600) certified under IS 2062:2011 Grade E250 / E350 for bridge & factory building frames.',
    image_url: '/images/structural_beams.jpg',
    specs: { Grade: 'IS 2062 E250 / E350', Sections: 'ISMB 100 - 600', Standard: 'IS 808', Application: 'Bridges & High Rises' }
  },
  {
    id: 'p3',
    name: 'Hot Rolled (HR) Steel Coils & Sheets (2mm - 12mm)',
    sku: 'US-COIL-HR',
    category: 'Coils & Sheets',
    base_price: 52800.00,
    description: 'Industrial hot rolled coil stock with uniform gauge control and superior weldability for automotive chassis & heavy equipment.',
    image_url: '/images/steel_coils.jpg',
    specs: { Thickness: '2.0mm - 12.0mm', Width: '1250mm / 1500mm', Standard: 'IS 10748', CoilWeight: '15 - 28 Tons' }
  },
  {
    id: 'p4',
    name: 'Cold Rolled (CR) Close Annealed Steel Sheets',
    sku: 'US-COIL-CRCA',
    category: 'Coils & Sheets',
    base_price: 61000.00,
    description: 'High surface finish CRCA sheets designed for precision fabrication, panel enclosures, and appliance manufacturing.',
    image_url: '/images/steel_coils.jpg',
    specs: { Thickness: '0.4mm - 3.0mm', Finish: 'Matt / Bright', Standard: 'IS 513', Formability: 'Extra Deep Drawing' }
  },
  {
    id: 'p5',
    name: 'ERW & Seamless Heavy Steel Piping (1/2" to 14" NB)',
    sku: 'US-PIPE-ERW',
    category: 'Piping & Tubes',
    base_price: 63500.00,
    description: 'Black & Hot-Dip Galvanized carbon steel pipes according to IS 1239 / IS 3589 for industrial fluid distribution & HVAC.',
    image_url: '/images/steel_pipes.jpg',
    specs: { Size: '1/2" to 14" NB', Schedule: 'Sch 20 - Sch 80', Standard: 'IS 1239 / IS 3589', Coating: 'Galvanized / Black' }
  },
  {
    id: 'p6',
    name: 'Heavy Carbon Steel Boiler & Structural Plates',
    sku: 'US-PLT-CARBON',
    category: 'Plates',
    base_price: 59000.00,
    description: 'High strength pressure vessel and structural steel plates conforming to IS 2062 / ASTM A36 standard for heavy engineering.',
    image_url: '/images/structural_beams.jpg',
    specs: { Thickness: '6mm - 100mm', Grade: 'ASTM A36 / IS 2062', Testing: 'Ultrasonic Tested', Edge: 'Mill / Trimmed' }
  }
];

export const fetchSteelProducts = async () => {
  try {
    const api = createApiClient();
    const config = getStoredConfig();
    const response = await api.get('/external/products', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
    // The backend standardizes responses as { success: boolean, data: [...] }
    const responseData = response.data?.data;
    
    if (responseData && Array.isArray(responseData) && responseData.length > 0) {
      // Map images to generated AI photos if empty
      return responseData.map((p, idx) => {
        let finalImageUrl = p.image_url || MOCK_STEEL_PRODUCTS[idx % MOCK_STEEL_PRODUCTS.length].image_url;
        if (finalImageUrl && finalImageUrl.startsWith('/uploads')) {
          finalImageUrl = `${config.apiBaseUrl}${finalImageUrl}`;
        }

        let rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
        let finalImages = rawImages.map(img => {
          if (typeof img === 'string' && img.startsWith('/uploads')) {
            return `${config.apiBaseUrl}${img}`;
          }
          return typeof img === 'string' ? img : (img?.url || '');
        }).filter(Boolean);

        if (finalImages.length === 0 && finalImageUrl) {
          finalImages = [finalImageUrl];
        }

        const parsedTags = Array.isArray(p.tags) && p.tags.length > 0
          ? p.tags
          : (p.category ? [p.category, 'In Stock & Ready'] : ['Primary Steel', 'In Stock & Ready']);

        return {
          ...p,
          tags: parsedTags,
          specs: p.specifications && Object.keys(p.specifications).length > 0 ? p.specifications : MOCK_STEEL_PRODUCTS[idx % MOCK_STEEL_PRODUCTS.length].specs,
          image_url: finalImageUrl,
          images: finalImages
        };
      });
    }
    return MOCK_STEEL_PRODUCTS;
  } catch (error) {
    console.warn('Falling back to local steel catalog mock:', error.message);
    return MOCK_STEEL_PRODUCTS;
  }
};

export const submitRFQLead = async (leadData) => {
  const api = createApiClient();
  const response = await api.post('/external/leads', leadData);
  return response.data;
};

export const registerCustomer = async (customerData) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const payload = {
    org_code: config.orgCode,
    ...customerData
  };
  const response = await api.post('/external/customers/register', payload);
  return response.data;
};

export const loginCustomer = async (credentials) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const payload = {
    org_code: config.orgCode,
    ...credentials
  };
  const response = await api.post('/external/customers/login', payload);
  return response.data;
};

export const getFormSchema = async (formId) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const response = await api.get(`/external/forms/${formId}/schema?org_code=${config.orgCode}`);
  return response.data?.data;
};

export const submitDynamicForm = async (formId, formData) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const payload = {
    org_code: config.orgCode,
    ...formData
  };
  const response = await api.post(`/external/forms/${formId}/submit`, payload);
  return response.data;
};

export const getFormSchemaByName = async (formName) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const response = await api.get(`/external/forms/by-name/${formName}/schema?org_code=${config.orgCode}`);
  return response.data?.data;
};

export const submitDynamicFormByName = async (formName, formData) => {
  const config = getStoredConfig();
  const api = createApiClient();
  const payload = {
    org_code: config.orgCode,
    ...formData
  };
  const response = await api.post(`/external/forms/by-name/${formName}/submit`, payload);
  return response.data;
};
