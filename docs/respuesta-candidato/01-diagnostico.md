# Diagnóstico del incidente

## Síntoma

En el ambiente integrado, `POST /api/documentos/cargar` respondía `200` con `Content-Type: text/html` mientras Nginx atendía esa ruta. El cliente esperaba JSON. El servicio Java no recibía la petición.

El enunciado lo describe como intermitente. Sin embargo, con el `nginx.conf` del gateway, esa ruta devolvía HTML en cada petición: el `location = /api/documentos/cargar` no tenía una rama que respondiera JSON.

## Alcance

Afecta la carga que entra por el gateway: la pantalla de carga y `scripts/smoke-test.sh`.

Si Nginx no está escuchando en el puerto `8088`, la llamada no continúa hacia el BFF. El BFF no publica puerto. Una llamada directa a `bff:3000`, dentro de la red de Compose, responde JSON, porque no pasa por ese `location`.

La validación de PDF, el tope de 5 MB en la aplicación, los timeouts, el correlation id y la diferencia de status `201` (Nest) frente a `202` (Java) quedan fuera de esta causa.

## Hipótesis priorizadas

| Prioridad | Hipótesis | Evidencia requerida | Resultado |
|---:|---|---|---|
| 1 | Nginx respondía HTML `200` en `POST /api/documentos/cargar` y no reenviaba al BFF. Esa ruta no tenía una rama que devolviera JSON. | El `location = /api/documentos/cargar` hacía `return 200` con el cuerpo `FALLO REPRODUCIDO`. El access log mostró `200` y 67 bytes. El Java no recibía la petición. El frontend y el smoke test llaman a esa ruta. | Confirmada |
| 2 | El proxy al BFF existía solo en `/api/documentos/upload`. Por eso `/cargar` no llegaba a Nest. | En el mismo `nginx.conf`, `proxy_pass http://bff:3000` estaba en `location = /api/documentos/upload`. Ni la UI ni `scripts/smoke-test.sh` usan `/upload`. | Confirmada. Explica por qué el BFF no veía la llamada del contrato. La respuesta que veía el cliente la producía la hipótesis 1. |
| 3 | Una llamada a `/api/documentos/upload` por el gateway sí llega al BFF y Nest responde JSON. Ese JSON es un `404`, porque el controlador solo implementa `POST /api/documentos/cargar`. | `DocumentsController` declara `@Post('cargar')`. No hay ruta `/upload`. Los clientes del ejercicio no llaman a `/upload`. | Confirmada. Es el único JSON que el gateway podía producir. No es una carga aceptada y no vuelve intermitente a `/cargar`. |
| 4 | Si Nginx está caído, el tráfico del puerto `8088` pasa directo al BFF y por eso a veces hay JSON. | Compose publica solo `8088:80` en el gateway. El BFF escucha en `bff:3000` dentro de la red y no publica puerto. | Descartada. Con Nginx caído, el `8088` no responde. No hay desvío al BFF. |
| 5 | El JSON de una carga exitosa aparece cuando la petición llega a Nest sin pasar por ese `location`, por ejemplo `POST http://bff:3000/api/documentos/cargar`. | El controlador devuelve el cuerpo del servicio Java. Ese destino no es el de la pantalla ni el del smoke test. | Confirmada como otro destino. No es el caso base del gateway. |
| 6 | El `try_files` del frontend devolvería `index.html` en otras rutas `/api` sin un `location` propio. | `location /` termina en `/index.html`. En `/cargar` ganaba el `location =`. | Relacionada. No es la causa de esta ruta. |
| 7 | El BFF o el Java estaban caídos y por eso salía HTML. | `/cargar` no hacía proxy. Un upstream caído, en una ruta que sí hace proxy, responde `502`, no un `200` con el HTML fijo. | Descartada |

## Causa raíz

En el ambiente integrado, Nginx cortaba `POST /api/documentos/cargar` y devolvía HTML `200` en cada petición. Ese `location` no reenviaba al BFF y no tenía una salida JSON. El `proxy_pass` estaba en `/api/documentos/upload`, ruta que la pantalla y el smoke test no usan. Una llamada a `/upload` llegaría a Nest y obtendría un `404` en JSON, no la carga aceptada. Si Nginx no está escuchando, el puerto `8088` no pasa la petición al BFF. El Java no participaba porque la petición del contrato no salía del gateway.

## Mitigación inmediata

Cambiar el `location` de `/api/documentos/cargar` para que haga `proxy_pass http://bff:3000` y deje de devolver el HTML fijo. Con eso la ruta del contrato llega al BFF y la respuesta exitosa es JSON.

## Solución definitiva

Se usa un `location /api/` hacia `http://bff:3000`, sin path al final, para que la URI llegue intacta a Nest. `client_max_body_size` queda en 5 MB, alineado al contrato. Se retiran el `return 200` de HTML y el proxy suelto de `/upload`. El `location /` del frontend se mantiene.

## Riesgos

Un `proxy_pass` con barra final recortaría `/api/` y Nest vería otra ruta. Si el BFF cae, Nginx sigue respondiendo su página HTML de `502`. El BFF valida que el archivo sea PDF y no supere 5 MB, corta la llamada al Java a los 5 segundos, responde esos rechazos en JSON y propaga `x-request-id`. El log ya no escribe el nombre del archivo. Sigue pendiente la página de error JSON de Nginx cuando el BFF no arranca, y alinear el `201` de Nest con el `202` del Java.

## Plan de reversa

Volver el `nginx.conf` anterior y reconstruir la imagen del gateway. El conf se copia en el build (`infra/nginx/Dockerfile`). Editar el archivo en el repo no cambia el contenedor que ya está corriendo.
