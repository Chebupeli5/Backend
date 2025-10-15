import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());

// Handle preflight OPTIONS requests
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  res.sendStatus(200);
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Test endpoint for CORS debugging
app.get('/cors-test', (req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    origin: req.headers.origin,
    protocol: req.protocol,
    host: req.headers.host,
    'x-forwarded-proto': req.headers['x-forwarded-proto']
  });
});

app.use('/api', routes);

// Serve OpenAPI spec as JSON so validator can fetch it by URL
app.get('/docs/openapi.json', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host || 'localhost:3000';
  let finalProtocol = protocol;
  if (host.includes('ngrok') || req.headers['x-forwarded-proto'] === 'https') {
    finalProtocol = 'https';
  }
  const baseUrl = `${finalProtocol}://${host}`;
  const modifiedSpec = {
    ...openApiSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      { url: 'http://localhost:3000', description: 'Local development server' },
      { url: 'http://{host}:3000', description: 'Custom server', variables: { host: { default: 'localhost' } } }
    ]
  };
  res.json(modifiedSpec);
});

// Custom validator badge script for Swagger UI
app.get('/docs/validator-badge.js', (_req: Request, res: Response) => {
  res.type('application/javascript').send(`
(function(){
  var SPEC_PATH = '/docs/openapi.json';
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function waitForTopbar(cb){ var tries=0; var iv=setInterval(function(){ var el=document.querySelector('.swagger-ui .topbar .wrapper .topbar-wrapper') || document.querySelector('.topbar-wrapper'); if(el || tries>50){ clearInterval(iv); cb(el); } tries++; }, 150); }
  function createBadge(status, count, href){
    var badge=document.createElement('a');
    badge.href=href; badge.target='_blank'; badge.rel='noopener noreferrer';
    badge.style.marginLeft='auto'; badge.style.display='inline-flex'; badge.style.alignItems='center'; badge.style.gap='8px';
    badge.style.padding='4px 10px'; badge.style.borderRadius='4px'; badge.style.fontWeight='600'; badge.style.textDecoration='none'; badge.style.border='1px solid transparent';
    if(status==='ok'){ badge.style.background='#10b981'; badge.style.color='#fff'; badge.textContent='Valid OpenAPI'; }
    else if(status==='fail'){ badge.style.background='#ef4444'; badge.style.color='#fff'; badge.textContent='OpenAPI Issues' + (typeof count==='number' ? ' ('+count+')' : ''); }
    else { badge.style.background='#9ca3af'; badge.style.color='#111827'; badge.textContent='Validator Unavailable'; }
    return badge;
  }
  ready(function(){
    var specUrl = window.location.origin + SPEC_PATH + '?ts=' + Date.now();
    var validateUrl = '/docs/validate?url=' + encodeURIComponent(specUrl);
    var debugUrl = 'https://validator.swagger.io/validator/debug?url=' + encodeURIComponent(specUrl);
    fetch(validateUrl, { cache: 'no-store' }).then(async function(r){
      if(r.status===204) return { status: r.status, data: {} };
      var data = null; var text='';
      try { data = await r.clone().json(); }
      catch(e){ try { text = await r.text(); data = text ? JSON.parse(text) : {}; } catch(e2){ data = null; } }
      return { status: r.status, data: data };
    }).then(function(resp){
      var data = resp && resp.data; var ok=null, count;
      if(data===null){
        // If validator returned 200 but body unparsable/empty, consider OK
        ok = (resp && resp.status === 200) ? true : null;
      } else if(data && Array.isArray(data.schemaValidationMessages)) {
        ok = data.schemaValidationMessages.length===0; count = data.schemaValidationMessages.length;
      } else if(data && Object.keys(data).length===0){
        ok = true;
      } else {
        ok = false; try { count = (data.schemaValidationMessages || data.messages || data.errors || []).length; } catch(e) {}
      }
      waitForTopbar(function(topbar){ if(!topbar) return; var status = ok===true ? 'ok' : ok===false ? 'fail' : 'na'; var badge = createBadge(status, count, debugUrl); topbar.appendChild(badge); });
    }).catch(function(){
      waitForTopbar(function(topbar){ if(!topbar) return; var badge = createBadge('na', undefined, 'https://validator.swagger.io'); topbar.appendChild(badge); });
    });
  });
})();
`);
});

// Server-side proxy to Swagger validator (avoids CORS issues)
app.get('/docs/validate', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url required' });
  const validatorUrl = 'https://validator.swagger.io/validator?url=' + encodeURIComponent(url);
  try {
    const r = await fetch(validatorUrl, {
      method: 'GET',
      headers: { 'accept': 'application/json' },
      cache: 'no-store' as any,
    } as any);
    const text = await r.text();
    res.status(r.status)
      .setHeader('cache-control', 'no-store, no-cache, must-revalidate')
      .setHeader('pragma', 'no-cache')
      .setHeader('content-type', r.headers.get('content-type') || 'application/json')
      .send(text);
  } catch (e: any) {
    res.status(502).json({ error: 'validator fetch failed', message: e?.message });
  }
});

app.use('/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host || 'localhost:3000';
  let finalProtocol = protocol;
  if (host.includes('ngrok') || req.headers['x-forwarded-proto'] === 'https') {
    finalProtocol = 'https';
  }
  const baseUrl = `${finalProtocol}://${host}`;

  const modifiedSpec = {
    ...openApiSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      { url: 'http://localhost:3000', description: 'Local development server' },
      { url: 'http://{host}:3000', description: 'Custom server', variables: { host: { default: 'localhost' } } }
    ]
  };

  swaggerUi.setup(modifiedSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      validatorUrl: 'https://validator.swagger.io/validator'
    },
    customSiteTitle: 'Finansik API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: '/docs/validator-badge.js',
    customCss: `
      .swagger-ui .topbar { display: block }
      .swagger-ui .info .title { color: #3b82f6 }
    `
  })(req, res, next);
});

export default app;



