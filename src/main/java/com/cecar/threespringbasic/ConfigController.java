package com.cecar.threespringbasic;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ConfigController {

    private final ConfigService service;

    public ConfigController(ConfigService service) {
        this.service = service;
    }

    @GetMapping("/config")
    public ConfigDTO getConfig() {
        return service.get();
    }

    @PostMapping(path = "/config", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ConfigDTO setConfig(@RequestBody ConfigDTO cfg) {
        return service.set(cfg);
    }
}
