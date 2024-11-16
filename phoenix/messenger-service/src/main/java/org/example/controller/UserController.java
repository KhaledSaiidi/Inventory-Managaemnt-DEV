package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.model.User;
import org.example.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class UserController {
    private  final UserService service;
    private final SimpMessagingTemplate messagingTemplate;
    @MessageMapping("/user.addUser")
    public void addUser(@Payload User user, SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes == null) {
            sessionAttributes = new HashMap<>();
            headerAccessor.setSessionAttributes(sessionAttributes);
        }
        sessionAttributes.put("userId", user.getNickName());
        service.saveUser(user);

        messagingTemplate.convertAndSendToUser(
                user.getNickName(),
                "/public",
                user
        );
    }
    @MessageMapping("/user.disconnectUser")
    public void disconnect(@Payload User user, SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getSessionAttributes() == null) {
            headerAccessor.setSessionAttributes(new HashMap<>());
        }
        service.disconnect(user);
        messagingTemplate.convertAndSendToUser(
                user.getNickName(),
                "/public",
                user
        );
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> findConnectedUsers() {
        return ResponseEntity.ok(service.findConnectUsers());
    }
}
