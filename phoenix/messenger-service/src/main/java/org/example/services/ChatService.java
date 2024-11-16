package org.example.services;

import lombok.RequiredArgsConstructor;
import org.example.model.Chat;
import org.example.repository.ChatRepo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepo chatRepo;
    private final ChatRoomService chatRoomService;
    public Chat save(Chat chatMessage){
        var chatId = chatRoomService.getChatRoomId(
                chatMessage.getSenderId(),
                chatMessage.getRecipientId()
                , true
                ).orElseThrow();
       chatMessage.setChatId(chatId);
       return chatRepo.save(chatMessage);
    }
    public List<Chat> findChatMessages (String senderId , String recipientId){
        var chattId = chatRoomService.getChatRoomId(senderId , recipientId , false);
        return  chattId.map(chatRepo::findByChatId).orElse(new ArrayList<>());
    }
}
