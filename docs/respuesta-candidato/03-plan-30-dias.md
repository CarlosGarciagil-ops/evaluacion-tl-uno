# Plan de mejora de 30 días

## Objetivo

Bajar el tiempo de revisión, partir los PR grandes y detectar antes de integrar el fallo de esta entrega: una ruta `/api/` que responde HTML.

Los números de partida son los del enunciado: cycle time de historias 6 días, PR cycle time 7,2 días, cambio de alcance 25 %, cobertura 52 %, 2 incidentes en el mes y PR de más de 800 líneas.

La validación de PDF, el tope de 5 MB, el timeout hacia el Java y el correlation id ya están en el BFF. El pipeline hoy solo compila.

## Acciones por semana

| Semana | Acción | Responsable sugerido | Evidencia de avance |
|---:|---|---|---|
| 1 | Medir el baseline de PR cycle time y de tamaño. Publicar la guía: por encima de 400 líneas el autor parte el cambio o explica por qué va junto. `npm test` del BFF entra al pipeline. | Quien toque el pipeline | El PR muestra el resultado de las pruebas |
| 2 | El job de pruebas del BFF queda bloqueante. En otro PR, Nginx deja de responder HTML cuando el BFF no arranca: el `502` de `/api/` pasa a JSON. | Quien mantenga el gateway, para el `502`. Quien toque el pipeline, para el job | Son dos PR. El de Nginx no mezcla la validación del BFF |
| 3 | Primera revisión en un día hábil. Si el PR espera al Tech Leader, otro integrante del equipo puede aprobarlo. El Tech Leader se queda con gateway, seguridad de la carga y pipeline. | El equipo, con el Tech Leader en esos tres cortes | Hay PR aprobados sin la revisión del Tech Leader |
| 4 | Leer PR cycle time, el porcentaje de PR sobre 400 líneas, los defectos de contrato que llegan a integración y el retrabajo de los cambios hechos con IA. Decidir ahí el `201` de Nest frente al `202` del Java. | Tech Leader, con el equipo | Una nota corta con la decisión de la semana |

## Métricas seleccionadas

| Métrica | Fuente | Decisión que habilita | Riesgo de mal uso |
|---|---|---|---|
| PR cycle time | El repositorio | Si sigue cerca de 7,2 días, achicar la cola de revisión antes de sumar controles | Aprobar rápido y saltarse el job de pruebas |
| Porcentaje de PR sobre 400 líneas | El repositorio | Partir gateway, BFF y pipeline en PR distintos | Contar PR chicos como productividad |
| Defectos de contrato que llegan a integración | CI y los incidentes | Mantener bloqueante la prueba de la carga | Subir la cobertura sin cubrir esta ruta |
| Retrabajo de cambios asistidos por IA | Revisión y bugs posteriores | Seguir usando IA donde una prueba pueda contradecirla | Medir líneas o cantidad de prompts |

La cobertura de 52 % se mira y no se usa como meta.

## Cómo evitar que el Tech Leader sea un cuello de botella

El Tech Leader deja de ser el único que puede aprobar. Revisa el corte de `/api/`, la seguridad de la carga y el pipeline. El resto lo aprueban pares del equipo. Si un PR espera su revisión más de un día hábil, otro integrante puede aprobarlo.

## Cómo reducir PR grandes y tiempos de revisión

La guía de 400 líneas separa la página de error del gateway y el job de pruebas. La validación del BFF ya no entra en ese paquete: ya está hecha. La primera revisión tiene como plazo un día hábil. Si el PR cycle time sigue cerca de 7,2 días, la prioridad es la cola de revisión, no un control nuevo.

## Cómo mejorar la calidad sin frenar el flujo

En estos 30 días el control que pasa a bloqueante es `npm test` del BFF. El `502` en JSON del gateway entra como un PR propio, no como un gate nuevo el primer día. La cobertura no se persigue como número. La prueba que importa es la de la carga: que `/api/documentos/cargar` no responda HTML.
