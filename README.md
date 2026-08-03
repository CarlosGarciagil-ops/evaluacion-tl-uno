# Evaluación Técnica — Tech Leader

## Objetivo

Resolver un incidente realista de una plataforma fullstack y demostrar criterio de Tech Leader en diagnóstico, arquitectura, calidad, seguridad, DevSecOps, observabilidad, métricas y uso responsable de IA.

La evaluación no premia la cantidad de código. Se evaluará la capacidad de priorizar, fundamentar decisiones, reducir riesgos y dejar una solución verificable.

## Stack del ejercicio

- Frontend: React + Vite
- BFF: NestJS
- Servicio de documentos: Java + Spring Boot
- Gateway: Nginx
- Contenedores: Docker Compose
- CI: GitHub Actions

## Escenario

La aplicación permite cargar documentos. El frontend invoca:

```http
POST /api/documentos/cargar
```

En el ambiente integrado, la solicitud responde algunas veces con contenido HTML en lugar de JSON. En esos casos, el servicio Java no recibe la petición.

Respuesta observada:

```http
HTTP/1.1 200 OK
Content-Type: text/html
```

Además, el equipo presenta los siguientes indicadores:

| Indicador | Resultado actual |
|---|---:|
| Cycle time de historias | 6 días |
| PR cycle time | 7,2 días |
| Cambio de alcance | 25% |
| Cobertura automatizada | 52% |
| Incidentes productivos | 2 en el último mes |
| Tamaño de algunos PR | Más de 800 líneas |

## Tiempo disponible

Máximo recomendado: **4 horas**.

No es obligatorio resolver todo. Se espera que el candidato priorice, implemente lo más crítico y documente claramente lo pendiente.

## Cómo ejecutar

Requisitos:

- Docker
- Docker Compose
- curl

```bash
docker compose up --build
```

En otra terminal:

```bash
./scripts/smoke-test.sh
```

## Contrato de carga documental

- Formato permitido: PDF
- Content-Type esperado: application/pdf
- Tamaño máximo permitido: 5 MB
- El campo multipart debe llamarse `file`
- Una carga exitosa debe responder JSON
- Las rutas `/api/*` nunca deben responder contenido HTML

## Actividades requeridas

### 1. Diagnóstico

Documentar en `docs/respuesta-candidato/01-diagnostico.md`:

- Síntoma y alcance.
- Hipótesis priorizadas.
- Evidencia utilizada para confirmar o descartar cada hipótesis.
- Causa raíz identificada.
- Mitigación inmediata.
- Solución definitiva.
- Riesgos y plan de reversa.

### 2. Corrección técnica

Implementar una corrección que asegure que:

- `POST /api/documentos/cargar` llegue al BFF.
- La respuesta exitosa sea JSON.
- Los errores no sean convertidos en respuestas exitosas.
- La solución sea verificable mediante pruebas o un script reproducible.

### 3. Seguridad y robustez

Identificar e implementar, al menos parcialmente:

- Validación de tipo de archivo.
- Validación de tamaño.
- Timeout de comunicación entre servicios.
- Manejo explícito de errores.
- Correlation ID o mecanismo equivalente de trazabilidad.
- Protección de información sensible en logs.

### 4. Pruebas y pipeline

Mejorar las pruebas y el pipeline para incorporar controles relevantes. Se espera justificar qué controles son bloqueantes y cuáles pueden incorporarse de forma progresiva.

### 5. Arquitectura

Completar `docs/respuesta-candidato/02-adr.md` con:

- Contexto.
- Alternativas.
- Decisión.
- Consecuencias.
- Riesgos.
- Rollback.

### 6. Liderazgo y métricas

Completar `docs/respuesta-candidato/03-plan-30-dias.md` con un plan para:

- Reducir PR cycle time.
- Disminuir PR de gran tamaño.
- Mejorar la detección temprana de defectos.
- Evitar que el Tech Leader sea un cuello de botella.
- Medir el impacto de IA sin usar líneas de código o cantidad de prompts como productividad.

### 7. Uso de IA

Completar `docs/respuesta-candidato/04-uso-ia.md` indicando:

- Herramientas utilizadas.
- Para qué se utilizaron.
- Qué propuestas fueron descartadas.
- Qué validaciones se realizaron.
- Qué riesgos se detectaron.

## Entregables

- Código modificado.
- Pruebas o evidencia reproducible.
- Los cuatro documentos de respuesta.
- Descripción de Pull Request usando `.github/pull_request_template.md`.

## Reglas

- Está permitido utilizar IA.
- Toda solución debe poder explicarse y defenderse.
- No se permite resolver el incidente desactivando controles de seguridad de forma permanente.
- No se evalúa la cantidad de cambios, sino la calidad del análisis y las decisiones.
