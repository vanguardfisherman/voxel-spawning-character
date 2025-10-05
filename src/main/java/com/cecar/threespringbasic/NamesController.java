package com.cecar.threespringbasic;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/names")
public class NamesController {
    private final NamesService service;

    public NamesController(NamesService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, String> all() {
        return service.all();
    }

    @PostMapping
    public Map<String, String> set(@RequestBody Map<String, String> body) {
        String key = body.get("key");
        String name = body.get("name");
        if (key == null || name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "key/name required");
        }
        service.set(key, name);
        return Map.of(key, name);
    }
}
