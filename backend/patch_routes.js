const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    
    // Replace GET with requirePermission to just authMiddleware
    // Example: router.get('/', requirePermission('clientes:ler'), clienteController.getAll); -> router.get('/', authMiddleware, clienteController.getAll);
    content = content.replace(/router\.get\('([^']+)',\s*requirePermission\('[^']+'\),\s*([^)]+)\);/g, "router.get('$1', authMiddleware, $2);");
    
    // For POST/PUT/DELETE, map the old ones to new ones based on file name or keep them
    if (file === 'clienteRoutes.js') {
        content = content.replace(/requirePermission\('clientes:(criar|editar|excluir)'\)/g, "requirePermission('TELA_CADASTRO_CLIENTES')");
    } else if (file === 'embalagemRoutes.js') {
        content = content.replace(/requirePermission\('embalagens:(criar|editar|excluir)'\)/g, "requirePermission('TELA_CADASTRO_EMBALAGENS')");
    } else if (file === 'pecaRoutes.js') {
        content = content.replace(/requirePermission\('pecas:(criar|editar|excluir)'\)/g, "requirePermission('TELA_CADASTRO_PECAS')");
    } else if (file === 'transportadoraRoutes.js') {
        content = content.replace(/requirePermission\('transportadoras:(criar|editar|excluir)'\)/g, "requirePermission('TELA_CADASTRO_TRANSPORTADORAS')");
    } else if (file === 'statusCargaRoutes.js') {
        // usually admin only or authMiddleware is enough for status since it's just basic logic
        content = content.replace(/requirePermission\('status:(criar|editar|excluir)'\)/g, "requirePermission('TELA_CADASTRO_PERFIS')"); // fallback to admin-ish
    }
    
    fs.writeFileSync(path.join(routesDir, file), content);
});

console.log('Routes patched successfully!');
