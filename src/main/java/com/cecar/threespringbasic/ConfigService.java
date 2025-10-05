package com.cecar.threespringbasic;

import org.springframework.stereotype.Service;

@Service
public class ConfigService {
    private ConfigDTO cfg = new ConfigDTO("#0b0f1a", "#00d8ff", 0.01);

    public ConfigDTO get() {
        return cfg;
    }

    public ConfigDTO set(ConfigDTO c) {
        if (c == null) return cfg;
        double s = c.speed();
        if (Double.isNaN(s)) s = 0.01;
        // limita velocidad: 0.0 a 0.2
        s = Math.max(0.0, Math.min(0.2, s));
        String bg = (c.bg() == null || c.bg().isBlank()) ? "#0b0f1a" : c.bg();
        String color = (c.color() == null || c.color().isBlank()) ? "#00d8ff" : c.color();
        cfg = new ConfigDTO(bg, color, s);
        return cfg;
    }
}
