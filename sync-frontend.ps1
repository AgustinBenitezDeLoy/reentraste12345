# Script para copiar frontend al backend
Write-Host "Copiando archivos del frontend al backend..." -ForegroundColor Green
cp ../frontend/public/*.html public/
cp ../frontend/public/*.css public/
cp ../frontend/public/*.js public/
cp ../frontend/admin/* public/admin/
Write-Host "Archivos copiados exitosamente!" -ForegroundColor Green
