package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.model.Chat;
import org.example.model.ChatNotification;
import org.example.services.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatMessageService;

    @MessageMapping("/chat")
    public void processMessage(@Payload Chat chatMessage) {
        // Save the message to the database
        Chat savedMessage = chatMessageService.save(chatMessage);

        // Send the saved message to the recipient through WebSocket
        messagingTemplate.convertAndSendToUser(
                chatMessage.getRecipientId(),
                "/queue/messages", // Correct destination pattern for WebSocket
                ChatNotification.builder()
                        .id(String.valueOf(savedMessage.getId()))
                        .recipientId(savedMessage.getRecipientId())
                        .senderId(savedMessage.getSenderId())
                        .content(savedMessage.getContent())
                        .build()
        );
        System.out.println("Message sent to /user/" + chatMessage.getRecipientId() + "/queue/messages");
    }

    @GetMapping("/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<Chat>> findChatMessages(
            @PathVariable("senderId") String senderId,
            @PathVariable("recipientId") String recipientId
    ) {
        // Fetch messages from the database
        List<Chat> messages = chatMessageService.findChatMessages(senderId, recipientId);
        return ResponseEntity.ok(messages);
    }


}
