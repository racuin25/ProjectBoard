import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { SocketService } from './shared/services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (currentUser) => {
        this.socketService.setupSocketConnection(currentUser);
        this.authService.setCurrentUser(currentUser);
      },
      error: (error) => {
        console.log('error', error);
        this.authService.setCurrentUser(null);
      },
    });

    this.authService.currentUser$.subscribe((res) => {
      console.log('res', res);
    });

    this.authService.isLogged$.subscribe((isLoggedIn) => {
      console.log('isLoggedIn', isLoggedIn);
    });
  }
}
