import {
  AfterViewInit,
  Component,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
  inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MaterialModule } from '../../../shared/modules/material.module';
import { SharedModule } from '../../../shared/modules/shared.module';
import { CardComponent } from '../../components/card/card.component';
import { EbookModel } from '../../../models/ebook.model';
import { NgForOf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { AuthState } from '../../../ngrxs/auth/auth.state';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../../ngrxs/auth/auth.actions';
import { Subscription } from 'rxjs';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { UserState } from '../../../ngrxs/user/user.state';
import * as EbookActions from '../../../ngrxs/ebook/ebook.actions';
import { EbookState } from '../../../ngrxs/ebook/ebook.state';
import * as UserEbookActions from '../../../ngrxs/user-ebook/user-ebook.actions';
import { UserEbookState } from '../../../ngrxs/user-ebook/user-ebook.state';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MaterialModule,
    SharedModule,
    CardComponent,
    NgForOf,
    SearchBarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  @ViewChildren('viewport') viewports!: QueryList<ElementRef>;
  @ViewChild('viewport') viewport!: ElementRef;
  isDragging = false;
  lichSuCards: EbookModel[] = [];
  thinhHanhCards: EbookModel[] = [];
  deCuCards: EbookModel[] = [];
  bangXepHangCards: EbookModel[] = [];
  readonly dialog = inject(MatDialog);

  isStaticUser = false;
  idToken: string = '';
  user$ = this.store.select('user', 'user');

  isLoadingReadingHistoryList$ = this.store.select(
    'user_ebook',
    'isLoadingReadingHistoryList',
  );
  isLoadingTrendingEbooks$ = this.store.select(
    'ebook',
    'isLoadingTrendingEbooks',
  );
  isLoadingRecommendEbooks$ = this.store.select(
    'ebook',
    'isLoadingRecommendEbooks',
  );
  isLoadingRatingEbooks$ = this.store.select('ebook', 'isLoadingRatingEbooks');

  constructor(
    private store: Store<{
      auth: AuthState;
      user: UserState;
      ebook: EbookState;
      user_ebook: UserEbookState;
    }>,
  ) {}

  ngOnInit(): void {
    // Select trendingEbooks, recommendEbooks, and ratingEbooks from the store
    this.subscriptions.push(
      this.store.select('auth', 'idToken').subscribe((value) => {
        console.log('idToken: ', value);
        this.idToken = value;
        if (this.idToken != '') {
          this.store.dispatch(UserEbookActions.findAllByUserId());
        }
      }),
      this.store.select('auth', 'isStaticUser').subscribe((value) => {
        this.isStaticUser = value;
      }),
      this.store.select('ebook', 'trendingEbooks').subscribe((ebooks) => {
        // console.log('trendingEbooks: ', ebooks);
        this.thinhHanhCards = ebooks;
      }),
      this.store.select('ebook', 'recommendEbooks').subscribe((ebooks) => {
        this.deCuCards = ebooks;
      }),
      this.store.select('ebook', 'ratingEbooks').subscribe((ebooks) => {
        this.bangXepHangCards = ebooks;
      }),
      this.store
        .select('user_ebook', 'readingHistoryList')
        .subscribe((ebooks) => {
          if (ebooks && ebooks.length > 0) {
            this.lichSuCards = ebooks.map((ebook) => ebook.ebook);
          } else {
            this.lichSuCards = [];
          }
        }),
    );

    // Dispatch actions to load the ebooks
    this.store.dispatch(EbookActions.listByTrend({ limit: 10 }));
    this.store.dispatch(EbookActions.listByRecommend({ limit: 10 }));
    this.store.dispatch(EbookActions.listByRating({ limit: 10 }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.store.dispatch(UserEbookActions.reset());
    this.store.dispatch(EbookActions.reset());
  }

  ngAfterViewInit() {
    this.viewports.forEach((viewport) => {
      const slider = viewport.nativeElement as HTMLElement;
      let isDown = false;
      let startX: number;
      let startY: number;
      let scrollLeft: number;
      let velocity = 0;
      let lastMoveTime: number;
      let lastMoveX: number;
      let isHorizontalSwipe = false;
      let isDragging = false;

      const safetyMargin = 100;
      const minVelocityForBounce = 0.8;
      let debounceTimeout: any;

      const onMouseDown = (e: MouseEvent) => {
        isDown = true;
        isDragging = false;
        slider.classList.add('clicking');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        lastMoveTime = Date.now();
        lastMoveX = e.pageX;
      };

      const onMouseLeave = () => {
        isDown = false;
        slider.classList.remove('active');
      };

      const onMouseUp = () => {
        isDown = false;
        slider.classList.remove('active');
        setTimeout(() => {
          isDragging = false;
        }, 0);
        applyInertia();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.1; // scroll-fast
        slider.scrollLeft = scrollLeft - walk;

        const now = Date.now();
        const deltaTime = now - lastMoveTime;
        const deltaX = e.pageX - lastMoveX;
        velocity = deltaX / deltaTime;

        lastMoveTime = now;
        lastMoveX = e.pageX;

        checkEndOfScroll();
      };

      const onTouchStart = (e: TouchEvent) => {
        isDown = true;
        isDragging = false;
        slider.classList.add('clicking');
        startX = e.touches[0].pageX - slider.offsetLeft;
        startY = e.touches[0].pageY;
        scrollLeft = slider.scrollLeft;
        lastMoveTime = Date.now();
        lastMoveX = e.touches[0].pageX;
        isHorizontalSwipe = false;
      };

      const onTouchEnd = () => {
        isDown = false;
        slider.classList.remove('active');
        setTimeout(() => {
          isDragging = false;
        }, 50);
        applyInertia();
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDown) return;

        const x = e.touches[0].pageX - slider.offsetLeft;
        const deltaX = Math.abs(e.touches[0].pageX - startX);

        const threshold = 5; // Ngưỡng để phát hiện cuộn ngang
        if (deltaX > threshold) {
          isHorizontalSwipe = true;
          isDragging = true;
          const walk = (x - startX) * 1.1;
          slider.scrollLeft = scrollLeft - walk;

          const now = Date.now();
          const deltaTime = now - lastMoveTime;
          const moveDeltaX = e.touches[0].pageX - lastMoveX;

          const minMoveDeltaX = 1; // Ngưỡng cho độ nhạy của việc phát hiện di chuyển
          if (Math.abs(moveDeltaX) > minMoveDeltaX) {
            velocity = moveDeltaX / deltaTime;
          }

          lastMoveTime = now;
          lastMoveX = e.touches[0].pageX;

          checkEndOfScroll();
        }
      };

      // const onTouchMove = (e: TouchEvent) => {
      //   if (!isDown) return;
      //
      //   const x = e.touches[0].pageX - slider.offsetLeft;
      //   const deltaX = Math.abs(e.touches[0].pageX - startX);
      //
      //   const threshold = 5; // Ngưỡng để phát hiện cuộn ngang
      //   if (deltaX > threshold) {
      //     isHorizontalSwipe = true;
      //     e.preventDefault();
      //     isDragging = true;
      //     const walk = (x - startX) * 1.1;
      //     slider.scrollLeft = scrollLeft - walk;
      //
      //     const now = Date.now();
      //     const deltaTime = now - lastMoveTime;
      //     const moveDeltaX = e.touches[0].pageX - lastMoveX;
      //
      //     const minMoveDeltaX = 1; // Ngưỡng cho độ nhạy của việc phát hiện di chuyển
      //     if (Math.abs(moveDeltaX) > minMoveDeltaX) {
      //       velocity = moveDeltaX / deltaTime;
      //     }
      //
      //     lastMoveTime = now;
      //     lastMoveX = e.touches[0].pageX;
      //
      //     checkEndOfScroll();
      //   }
      // };

      const applyInertia = () => {
        const friction = 0.95;
        const step = () => {
          if (Math.abs(velocity) < 0.1) return;
          slider.scrollLeft -= velocity * 5;
          velocity *= friction;
          requestAnimationFrame(step);
          checkEndOfScroll();
        };
        requestAnimationFrame(step);
      };

      let isBouncingBack = false;

      const checkEndOfScroll = () => {
        if (isBouncingBack) return;

        if (
          slider.scrollLeft + slider.clientWidth >=
          slider.scrollWidth - safetyMargin
        ) {
          if (Math.abs(velocity) > minVelocityForBounce) {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              isBouncingBack = true;
              slider.classList.add('bounce-back');
              setTimeout(() => {
                slider.classList.remove('bounce-back');
                isBouncingBack = false;
              }, 500);
            }, 10);
          }
        } else if (slider.scrollLeft <= safetyMargin) {
          if (Math.abs(velocity) > minVelocityForBounce) {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              isBouncingBack = true;
              slider.classList.add('bounce-back-start');
              setTimeout(() => {
                slider.classList.remove('bounce-back-start');
                isBouncingBack = false;
              }, 500);
            }, 10);
          }
        }
      };

      slider.addEventListener('mousedown', onMouseDown);
      slider.addEventListener('mouseleave', onMouseLeave);
      slider.addEventListener('mouseup', onMouseUp);
      slider.addEventListener('mousemove', onMouseMove);

      slider.addEventListener('touchstart', onTouchStart, { passive: false });
      slider.addEventListener('touchend', onTouchEnd, { passive: false });
      slider.addEventListener('touchmove', onTouchMove, { passive: false });

      // Ngăn chặn sự kiện click hoặc chạm vào card nếu đang kéo
      const cards = slider.querySelectorAll('app-card');
      cards.forEach((card) => {
        card.addEventListener('click', (e) => {
          if (isDragging) {
            e.stopImmediatePropagation();
          }
        });

        card.addEventListener('touchend', (e) => {
          if (isDragging) {
            e.stopImmediatePropagation();
          }
        });
      });
    });
  }

  openConfirmLogoutDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Đăng xuất',
        message: 'Bạn có chắc chắn muốn đăng xuất?',
      },
      restoreFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
      if (result == true) {
        console.log('User confirmed logout');
        this.logout();
      }
    });
  }

  logout() {
    this.store.dispatch(AuthActions.signOut());
  }
}
