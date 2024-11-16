import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Frame } from 'stompjs';
import { User } from '../models/messenger/user';
import { Chat } from '../models/messenger/Chat';
import { Status } from '../models/messenger/Status';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | undefined;
  private nickname: string = '';
  private fullname: string = '';
  private apiUrl = environment.url + "/messenger";
  private connectedUsers: User[] = [];
  private usersSubject: Subject<User[]> = new Subject<User[]>();

  constructor(private http: HttpClient) {}

  // Expose connected users as an observable
  get connectedUsers$(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  // Save user details (nickname and full name)
  saveUserDetails(nickname: string, fullname: string) {
    this.nickname = nickname;
    this.fullname = fullname;
  }

  // Establish WebSocket connection
  connect(
    nickname: string,
    fullname: string,
    onMessageReceived: (payload: Chat) => void,
    onError: () => void
  ) {
    this.nickname = nickname;
    this.fullname = fullname;
    const socket = new SockJS(`${this.apiUrl}/ws`);

    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => this.onConnected(onMessageReceived);
    this.stompClient.onStompError = () => onError();
    this.stompClient.activate();
  }

  // Handle WebSocket connection success
  private onConnected(onMessageReceived: (payload: Chat) => void) {
    if (this.stompClient?.connected) {
      console.log('STOMP client connected!');

      // Subscribe to chat messages (individual messages for this user)
      this.stompClient?.subscribe(`/user/${this.nickname}/queue/messages`, (message) =>
        onMessageReceived(JSON.parse(message.body) as Chat)
      );

      // Subscribe to public chat messages (modify if needed)
      this.stompClient?.subscribe(`/user/${this.nickname}/public`, (message) =>
        onMessageReceived(JSON.parse(message.body) as Chat)
      );

      // Subscribe to the list of connected users
      this.stompClient?.subscribe(`/topic/users`, (message: Frame) => {
        this.handleConnectedUsersUpdate(message.body);
      });

      // Notify the server that this user has joined (set status to ONLINE)
      this.stompClient?.publish({
        destination: '/app/user.addUser',
        body: JSON.stringify({
          nickName: this.nickname,
          fullName: this.fullname,
          status: Status.ONLINE  // Use Status enum here
        })
      });
    } else {
      console.error('STOMP client is not connected!');
    }
  }

  // Update the list of connected users
  private handleConnectedUsersUpdate(message: string) {
    const updatedUsers: User[] = JSON.parse(message);
    this.connectedUsers = updatedUsers;
    this.usersSubject.next(this.connectedUsers);
    console.log('Updated connected users:', this.connectedUsers);
  }

  // Send a message to a specific recipient
  sendMessage(content: string, recipientId: string) {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected.');
      return;
    }

    const chatMessage: Chat = {
      id: Date.now(),
      chatId: `${this.nickname}-${recipientId}`,
      senderId: this.nickname,
      recipientId: recipientId,
      content: content,
      timestamp: new Date()
    };

    this.stompClient?.publish({
      destination: '/app/chat',
      body: JSON.stringify(chatMessage)
    });
  }

  // Disconnect the user and notify the server
  disconnectUser() {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/user.disconnectUser',
        body: JSON.stringify({
          nickName: this.nickname,
          fullName: this.fullname,
          status: Status.OFFLINE  // Use Status enum here
        })
      });
    }
    this.stompClient?.deactivate();
  }

  // Get the list of connected users from the server (using HTTP)
  getConnectedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  // Get the old chat messages between two users (using HTTP)
  getChatMessages(senderId: string, recipientId: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/messages/${senderId}/${recipientId}`);
  }

  // Get the nickname of the current user
  getCurrentUserNickname(): string {
    return this.nickname;
  }

  // Get the full name of the current user
  getCurrentUserFullname(): string {
    return this.fullname;
  }
}
