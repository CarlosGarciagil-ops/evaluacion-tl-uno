# Registro de uso de IA

## Herramientas utilizadas

Cursor, en esta conversación, para leer el repositorio, proponer el diagnóstico y aplicar los cambios que se fueron cerrando.

Las propuestas se discutieron, se argumentaron y se contraargumentaron. La decisión final la tomó la persona, no la herramienta.

## Tareas asistidas

Ubicar por qué `/api/documentos/cargar` devolvía HTML. Separar el caso del gateway del caso de una llamada directa al BFF. Cambiar Nginx a `location /api/`. Implementar en el BFF la validación de PDF, el tope de 5 MB, el timeout, los errores en JSON, el `x-request-id` y el log sin el nombre del archivo. Redactar el diagnóstico, el ADR y el plan de 30 días después de cada confirmación.

## Propuestas descartadas

Mover el frontend a `/api/documentos/upload`. Sacar el gateway y publicar el BFF. Corregir la ruta solo en Nest. Dejar el `location` solo en `/cargar`. Explicar el HTML como algo que dependía de cómo se levanta la aplicación, o como un desvío al BFF cuando Nginx está caído.

Esas opciones salieron en la conversación y se dejaron de lado después de contrastarlas con el contrato y con el código.

## Validaciones realizadas

`./scripts/smoke-test.sh` respondió `201` y `application/json`. `POST /api/inexistente` respondió `404` en JSON. Un archivo que no es PDF respondió `415` en JSON, con el `x-request-id` que mandó el cliente. Las 14 pruebas del BFF pasaron. El log del rechazo no incluye el nombre del archivo.

## Riesgos detectados

Una propuesta podía cumplir el proxy viejo y romper el contrato, como cambiar el cliente a `/upload`. Otra podía dejar el síntoma a medias, como un `location` que solo cubre `/cargar`. El texto del diagnóstico llegó a decir que el resultado dependía de cómo se levanta el servicio. Eso se corrigió antes de dejarlo. La prueba automática no reemplaza leer el `proxy_pass`: una barra final habría recortado `/api/`.

## Responsabilidad técnica asumida

La persona revisó cada propuesta, pidió argumentos y los contrastó con lo que muestra el repositorio. Ejemplos de esas decisiones: el fallo del gateway es determinista y no depende de cómo se levanta el servicio; si Nginx está caído la petición no pasa al BFF; el enrutamiento queda en `/api/*` y no solo en `/cargar`; el corte de seguridad se implementa ahora y no queda solo como pendiente.

Ningún apartado entró a los documentos ni al código hasta después de esa decisión. Cursor asistió el análisis y la redacción. La responsabilidad del diagnóstico, del ADR, del plan de 30 días y de los cambios en Nginx y en el BFF es de la persona.
