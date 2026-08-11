# Reglas y Directivas del Proyecto CRM Terravall

Este archivo contiene las directivas recurrentes que el asistente de IA (Antigravity) debe cumplir siempre que trabaje en este proyecto.

---

## 🎨 1. Interfaz de Usuario (UI/UX) y Formularios
- **Sin saltos de línea innecesarios en etiquetas:** Mantener las etiquetas de los formularios (`Label`) en una sola línea de forma limpia usando clases como `whitespace-nowrap` y asignando anchos proporcionales en la rejilla.
- **Formularios estructurados y adaptativos:** Utilizar rejillas responsivas (`grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3`) para organizar los campos de manera clara y espaciosa.
- **Desglose de Direcciones:** Las direcciones de Propietarios (Vendedores) y Compradores deben mantenerse desglosadas en 6 campos independientes:
  1. Domicilio (Calle, Avda, Plaza...)
  2. Número
  3. Piso y Letra
  4. Municipio
  5. Provincia
  6. Código Postal (CP)

---

## 📄 2. Contratos de Arras y Fincas Registrales
- **Identificación completa de Fincas:** Cada Finca Registral debe disponer de sus campos dedicados:
  - Denominación / Elemento *(ej: Vivienda principal, Garaje)*
  - Nº Finca Registral
  - CRU *(Código Registro Único)*
  - Registro de la Propiedad *(Ciudad)*
  - Nº de Registro *(ej: Nº 1, Nº 3)*
  - Referencia Catastral
  - Dirección Completa de la Finca
  - Precio Finca (€)
- **Redacción Legal Automática:** El generador de documentos (`ArrasContractDocument.tsx`) debe integrar y formatear automáticamente estos campos desglosados en texto legal formal en español *(ej: "finca registral nº 14.520 (CRU: 47012000123456), inscrita en el Registro de la Propiedad de Laguna de Duero Nº 1..."*).

---

## 🗄️ 3. Base de Datos y Persistencia (Supabase)
- **Sincronización de Campos:** Al añadir nuevos campos a la interfaz o a los contratos:
  1. Actualizar el estado inicial y los handlers en React.
  2. Actualizar el esquema de validación Zod (`src/schema/property.schema.ts`).
  3. Incluir las columnas correspondientes en la llamada de actualización de Supabase.
  4. Generar o actualizar el script de migración SQL (`.sql`) en la raíz del proyecto para aplicarlo fácilmente en el SQL Editor de Supabase.

---

## ⚙️ 4. Estilo de Código y Calidad
- **TypeScript:** Validar siempre con `npx tsc --noEmit` para garantizar cero errores de tipos.
- **Comprobación en vivo:** Mantener el servidor dev (`npm run dev`) sin errores en tiempo de ejecución ni advertencias severas.
