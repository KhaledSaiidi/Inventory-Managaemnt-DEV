package com.phoenix.controller;

import com.phoenix.dto.ReclamationDto;
import com.phoenix.dto.StockEvent;
import com.phoenix.kafka.StockProducer;
import com.phoenix.model.Product;
import com.phoenix.repository.IUncheckHistoryRepository;
import com.phoenix.services.IAgentProdService;
import com.phoenix.services.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final IProductService iProductService;
    @Autowired
    private StockProducer stockProducer;

    private final IAgentProdService iAgentProdService;
    @Scheduled(fixedRate = 86400000) // 24 hours in milliseconds

    // This method will be executed every 2 minutes
    @Scheduled(fixedRate = 60000)

    public void checkProductsDueDate() {
        List<ReclamationDto> reclamationDtos = iProductService.getProductsForAlert();
        if(!reclamationDtos.isEmpty()){
            StockEvent stockEvent = new StockEvent();
            stockEvent.setReclamationDtos(reclamationDtos);
            stockProducer.sendMessage(stockEvent);
        }
    }


    //@Scheduled(fixedRate = 600000) // test Runs each 10 min
    @Scheduled(fixedRate = 172800000) // 48 hours in milliseconds
    public void deleteAgentProdsWithoutProducts() {
        iAgentProdService.deleteAgentProdsWithoutProducts();
    }
}
