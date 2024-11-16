package org.example.services;

import lombok.RequiredArgsConstructor;
import org.example.model.ChatRoom;
import org.example.repository.ChatRoomRepo;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private  final ChatRoomRepo chatRoomRepo;


    public Optional<String> getChatRoomId(
            String senderId ,
            String recipientId ,
            boolean createRoomIfNotExists){

return chatRoomRepo.findBySenderIdAndRecipientId(senderId,recipientId)
        .map(ChatRoom::getChatId)
        .or( () -> {
    if (createRoomIfNotExists){
       
var chatId = createRoomId(senderId, recipientId);
return  Optional.of(chatId);
    }return  Optional.empty();
});
    }

    private String createRoomId(String senderId, String recipientId) {
    var chatId = String.format("%s_%s", senderId , recipientId);
    ChatRoom senderRecipient = ChatRoom.builder()
            .chatId(chatId)
            .senderId(senderId)
            .recipientId(recipientId)
            .build();
        ChatRoom recipientSender = ChatRoom.builder()
                .chatId(chatId)
                .senderId(recipientId)
                .recipientId(senderId)
                .build();
        chatRoomRepo.save(recipientSender);
        chatRoomRepo.save(senderRecipient);


        return  chatId;
    }
}
