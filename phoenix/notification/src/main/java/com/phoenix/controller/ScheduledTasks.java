package com.phoenix.controller;

import com.phoenix.services.IReclamationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final IReclamationService iReclamationService;
    @Scheduled(fixedRate = 60000)

    public void deleteOldMatchingReclamations() {
        iReclamationService.deleteOldMatchingReclamations();
    }
}
