import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { delay, switchMap, timer } from 'rxjs';
import { Chat } from 'src/app/models/messenger/Chat';
import { User } from 'src/app/models/messenger/user';
import { ReclamType } from 'src/app/models/notifications/ReclamType';
import { ReclamationDto } from 'src/app/models/notifications/ReclamationDto';
import { NotificationService } from 'src/app/services/notification.service';
import { SecurityService } from 'src/app/services/security.service';
import { StompService } from 'src/app/services/stomp.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { Status } from 'src/app/models/messenger/Status';
@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.css']
})
export class BaseComponent implements OnInit{
  @ViewChild('messagesList') private messagesList!: ElementRef;
  isUserListOpen: boolean = false;
activeChatBoxes: { user: User; messages: Chat[]; newMessage: string }[] = [];

constructor (public securityService: SecurityService, private router: Router,
             public stompService: StompService, public notificationService: NotificationService,
             private webSocketService: WebSocketService) {}
username: string = "";
fullname: string = '';
messages: Chat[] = [];
connectedUsers: User[] = [];
selectedUserId: string = '';
messageContent: string = '';
selectedUserName: string = '';
messageByUser: Chat[] = [];
Status = Status;
isChatOpen: boolean = false;
openChatBoxes: { user: User, messages: Chat[], messageContent: string }[] = [];
loggedInUserId: string = '';

isManager: boolean = this.securityService.hasRoleIn(['MANAGER', 'IMANAGER']);

public ngOnInit() {
  if (this.securityService.profile && this.securityService.profile.username) {
    console.log(this.securityService.profile);
    this.username = this.securityService.profile.username;
    this.fullname = this.securityService.profile.firstName + " " + this.securityService.profile.lastName;
    this.loggedInUserId = this.username;
    this.webSocketService.saveUserDetails(this.username, this.fullname);
    this.webSocketService.connect(
      this.username,
      this.fullname,
      (payload: Chat) => this.onMessageReceived(payload),
      () => this.onError()
    );
    this.webSocketService.connectedUsers$.subscribe((users: User[]) => {
      this.connectedUsers = users.filter(user => user.nickName !== this.username);
    });
  }
  this.refreshnotifications();
  this.initializeWebSocket();
}

private initializeWebSocket(): void {
  this.stompService.subscribe('/topic/notification', (): any => {
    this.refreshnotifications();
  });
}


  onLogout() {
    this.webSocketService.disconnectUser();
    this.securityService.kcService.logout(window.location.origin);
  }

  
  navigateToscanners(userName?: string) {
    if (userName === undefined) {
      console.log('Invalid Username');
      return;
    }
    this.router.navigate(['/scanners'], { queryParams: { id: userName } });      
  }

  
  navigateToUserdetails(userName?: string) {
    if (userName === undefined) {
      console.log('Invalid Username');
      return;
    }
    this.router.navigate(['/userdetails'], { queryParams: { id: userName } });      
  }
  navigateToStocks(){
    window.location.href = '/stocks';
  }

  navigateToProds(){
    window.location.href = '/navigateprods';
  }
  refreshnotifications(){
    this.getreclamations();
  }

  reclamations: ReclamationDto[] = [];
  emptyreclamaations: boolean = true;
  notificationnumber : number = 0;
  receiver: string= "";
  reclamationsnotSeen: ReclamationDto[] = [];

  getreclamations(){
    this.receiver = this.username;
    this.notificationService.getNewReclamations(this.receiver).subscribe(
      (data) => {
    this.reclamations = data as ReclamationDto[];
    this.notificationnumber = 0;
    if(this.reclamations.length > 0){
      this.emptyreclamaations =false;
      this.reclamations.forEach(reclamation => {
        const lowerCaseUsername = this.username.toLowerCase();
        const vuedreceivers = reclamation.vuedreceivers 
        ? reclamation.vuedreceivers.map(receiver => receiver.toLowerCase()) 
        : [];

        if (!vuedreceivers.includes(lowerCaseUsername)) {
          this.notificationnumber++;
            this.reclamationsnotSeen.push(reclamation);
        }
    }); 
    console.log("reclamations not seen" + this.reclamationsnotSeen.map(obj => JSON.stringify(obj)));
      }
      },
      (error) => {
        console.error('Failed to get reclamations:', error);
      }
    );
  
}

ifUserSeentrue(notification: ReclamationDto): boolean {
  if (notification.vuedreceivers != null && notification.vuedreceivers.includes(this.username)) {
    return true;
  } 
  return false; 
  }

  terminatenotif(): void {
    timer(2000)
      .pipe(
        switchMap(() => this.notificationService.terminateNotification(this.username, this.reclamationsnotSeen)),
        delay(2000)
      )
      .subscribe(
        () => {
          this.notificationnumber = 0;
        },
        (error) => {
          console.log(error);
        }
      );
  }

  navigateToUserNotifications(userName?: string) {
    if (userName === undefined) {
      console.log('Invalid Username');
      return;
    }
    this.router.navigate(['/userdetails'], { 
      queryParams: { 
        id: userName,
        selectedTab: 2
      } 
    });      
  }
   
  
  toggleChatBox() {
    this.isChatOpen = !this.isChatOpen;
  }

  openChatBox(nickName: string, fullName: string) {
    const existingChat = this.openChatBoxes.find(chatBox => chatBox.user.nickName === nickName);

    if (!existingChat) {
      if (this.openChatBoxes.length >= 3) {
        this.openChatBoxes.shift(); // Limit to 3 chat boxes
      }

      const user = this.connectedUsers.find(user => user.nickName === nickName);

      if (user) {
        this.openChatBoxes.push({
          user: { nickName, fullName, status: user.status },
          messages: [],
          messageContent: ''
        });

        this.webSocketService.getChatMessages(this.webSocketService.getCurrentUserNickname(), nickName)
          .subscribe(messages => {
            const chatBox = this.openChatBoxes.find(chatBox => chatBox.user.nickName === nickName);
            if (chatBox) chatBox.messages = messages;
          });
      } else {
        console.error(`User with nickName "${nickName}" not found in connectedUsers.`);
      }
    }
  }

  closeChatBox(nickName: string) {
    this.openChatBoxes = this.openChatBoxes.filter(chatBox => chatBox.user.nickName !== nickName);
  }


  sendMessage(chatBox: { user: User; messages: Chat[]; messageContent: string }) {
    if (chatBox.messageContent.trim()) {
      const chatMessage: Chat = {
        id: Date.now(),
        chatId: `${chatBox.user.nickName}-${Date.now()}`,
        senderId: this.webSocketService.getCurrentUserNickname(),
        recipientId: chatBox.user.nickName,
        content: chatBox.messageContent,
        timestamp: new Date()
      };

      this.webSocketService.sendMessage(chatMessage.content, chatBox.user.nickName);

      chatBox.messages.push(chatMessage);
      chatBox.messageContent = ''; // Clear message input
    }
  }

  onMessageReceived(payload: Chat) {
      const message = payload as Chat;
      const chatBox = this.openChatBoxes.find(chatBox => chatBox.user.nickName === message.senderId);
      if (chatBox) {
        chatBox.messages.push(message);
      }
    }

  selectUser(userId: string, userName: string) {
    this.selectedUserId = userId;
    this.selectedUserName = userName;
    this.messageByUser = [];

    // Fetch old chat messages from the server
    this.webSocketService.getChatMessages(this.webSocketService.getCurrentUserNickname(), userId).subscribe(messages => {
      this.messageByUser = messages;
    });

    console.log('Selected user:', userId);
  }


  onError() {
    console.error('Could not connect to WebSocket');
  }

  toggleUserList() {
    this.isUserListOpen = !this.isUserListOpen;
  }
}
