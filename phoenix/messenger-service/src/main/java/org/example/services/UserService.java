package org.example.services;

import lombok.RequiredArgsConstructor;
import org.example.model.Status;
import org.example.model.User;
import org.example.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private Set<User> connectedUsers = new HashSet<>();

    public void saveUser(User user) {
        Optional<User> existingUser = userRepository.findById(user.getNickName());
        if (existingUser.isPresent()) {
            User dbUser = existingUser.get();
            dbUser.setStatus(Status.ONLINE);
            userRepository.save(dbUser);
        } else {
            user.setStatus(Status.ONLINE);
            userRepository.save(user);
        }

        connectedUsers.add(user);

        notifyConnectedUsers();
    }

    public void disconnect(User user) {
        Optional<User> storedUser = userRepository.findById(user.getNickName());
        if (storedUser.isPresent()) {
            User dbUser = storedUser.get();
            dbUser.setStatus(Status.OFFLINE);
            userRepository.save(dbUser);
        }

        connectedUsers.stream()
                .filter(u -> u.getNickName().equals(user.getNickName()))
                .findFirst()
                .ifPresent(u -> u.setStatus(Status.OFFLINE));
        notifyConnectedUsers();
    }

    public List<User> findConnectUsers() {
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            connectedUsers.stream()
                    .filter(u -> u.getNickName().equals(user.getNickName()))
                    .findFirst()
                    .ifPresent(u -> user.setStatus(u.getStatus()));
        }

        return allUsers;
    }

    private void notifyConnectedUsers() {
        List<User> connectedUserList = findConnectUsers();
        messagingTemplate.convertAndSend("/topic/users", connectedUserList);
    }
}
