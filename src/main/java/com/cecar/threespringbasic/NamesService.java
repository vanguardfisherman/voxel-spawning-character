package com.cecar.threespringbasic;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NamesService {
    private final Map<String, String> names = new ConcurrentHashMap<>();

    public Map<String, String> all() {
        return names;
    }

    public String set(String key, String name) {
        if (key == null || key.isBlank() || name == null || name.isBlank()) return null;
        names.put(key, name);
        return name;
    }
}
