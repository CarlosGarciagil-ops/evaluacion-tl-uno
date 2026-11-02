# ADR — Enrutamiento y procesamiento de carga documental

## Estado

Aceptado

## Contexto

El gateway es la única puerta pública del ambiente integrado. El navegador y el smoke test llaman a `POST /api/documentos/cargar` y esperan JSON. El contrato pide además que las rutas `/api/*` no respondan HTML.

El `nginx.conf` anterior respondía HTML `200` en `/api/documentos/cargar` y solo hacía proxy de `/api/documentos/upload`. Nest no implementa `/upload`, así que esa ruta no era una carga exitosa. La petición del contrato no salía del gateway y el servicio Java no la recibía.

## Alternativas consideradas

- `location /api/` con `proxy_pass http://bff:3000`, sin path. La URI llega intacta a Nest y cualquier ruta `/api/*` deja de caer en el HTML del frontend.
- Dejar solo `location = /api/documentos/cargar`. Corrige el incidente y deja el resto de `/api/*` en `try_files`, que responde `index.html`.
- Cambiar el frontend a `/api/documentos/upload`. Coincide con el proxy viejo y rompe el contrato y la UI. Nest no tiene esa ruta, así que respondería `404` en JSON.
- Sacar el gateway y publicar el BFF. Se pierde el estático y el único punto de entrada.
- Corregir la ruta solo en el BFF. Nginx cortaba la petición antes de llegar a Nest.

## Decisión

El gateway hace proxy de `/api/` hacia `http://bff:3000`, sin path al final. `client_max_body_size` queda en 5 MB. Se eliminan el HTML fijo y el `location` de `/upload`. El frontend sigue en `location /`.

Se elige el prefijo `/api/` aunque hoy el BFF tenga un solo endpoint. El corte ya existe en la arquitectura: lo estático se queda en Nginx y lo que empieza por `/api/` va al BFF. El contrato habla de `/api/*`, no solo de `/cargar`.

## Consecuencias positivas

`POST /api/documentos/cargar` llega a Nest y la respuesta exitosa es JSON. El smoke test puede comprobar el `Content-Type`. Una ruta `/api/` nueva no exige otro cambio de gateway. El frontend sigue sirviéndose desde Nginx.

## Consecuencias negativas

Si el BFF cae, Nginx responde su página HTML de `502`. El BFF valida PDF y 5 MB, corta la llamada al Java a los 5 segundos y propaga `x-request-id`. El log ya no escribe el nombre del archivo. Nest responde `201` en el POST aunque el Java marque `202 ACCEPTED`.

## Riesgos

Un `proxy_pass` con barra final recortaría el prefijo `/api/` y Nest vería otra ruta. El conf se copia en la imagen del gateway: el cambio existe en runtime solo después de reconstruir esa imagen.

## Estrategia de rollback

Restaurar el `nginx.conf` anterior y reconstruir la imagen del gateway. Editar el archivo en el repo no cambia el contenedor que ya está corriendo.
