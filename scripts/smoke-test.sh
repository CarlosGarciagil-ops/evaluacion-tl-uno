#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8088}"
MAX_ATTEMPTS=30
ATTEMPT=0
TMP_FILE="$(mktemp)"
HEADERS="$(mktemp)"
BODY="$(mktemp)"
trap 'rm -f "$TMP_FILE" "$HEADERS" "$BODY"' EXIT

printf '%s
' '%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 0 >>
stream

endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000119 00000 n 
0000000207 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
0
%%EOF' > "$TMP_FILE"

printf '\n== Ejecutando carga documental ==\n'
while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
  if curl -sS -D "$HEADERS" -o "$BODY" -X POST -F "file=@${TMP_FILE};type=application/pdf;filename=prueba.pdf" "${BASE_URL}/api/documentos/cargar" >/dev/null 2>&1; then
    break
  fi

  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo 'FALLO REPRODUCIDO: el ambiente no quedó disponible en 30 segundos.' >&2
    exit 1
  fi

  sleep 1
done

cat "$HEADERS"
printf '\nCuerpo (primeros 200 caracteres):\n'
head -c 200 "$BODY"
printf '\n\n'

CONTENT_TYPE="$(grep -i '^Content-Type:' "$HEADERS" | tr -d '\r' || true)"
BODY_TEXT="$(tr '\r\n' ' ' < "$BODY" | cut -c1-200)"

if echo "$CONTENT_TYPE" | grep -qi 'text/html'; then
  echo 'FALLO REPRODUCIDO: la respuesta es HTML.'
  echo "Contenido detectado: $BODY_TEXT"
  exit 1
fi

if echo "$CONTENT_TYPE" | grep -qi 'application/json'; then
  echo 'OK: la respuesta es JSON.'
  exit 0
fi

echo 'FALLO REPRODUCIDO: la respuesta no es JSON.'
exit 1
