package cl.uno.documents;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/documentos")
public class DocumentController {

    @PostMapping("/procesar")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> process(@RequestBody Map<String, Object> request) {
        return Map.of(
            "documentId", UUID.randomUUID().toString(),
            "status", "ACCEPTED",
            "receivedAt", Instant.now().toString(),
            "filename", request.getOrDefault("filename", "unknown")
        );
    }
}
