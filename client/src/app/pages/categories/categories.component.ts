import {
  Component,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Renderer2,
} from '@angular/core';
import { MaterialModule } from '../../../shared/modules/material.module';
import { SharedModule } from '../../../shared/modules/shared.module';
import { CardComponent } from '../../components/card/card.component';
import { EbookModel } from '../../../models/ebook.model';
import { CardService } from '../../../services/card.service';
import { NgForOf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { Store } from '@ngrx/store';
import { CategoryState } from '../../../ngrxs/category/category.state';
import { Subscription } from 'rxjs';
import { CategoryModel } from '../../../models/category.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    MaterialModule,
    SharedModule,
    CardComponent,
    NgForOf,
    SearchBarComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('viewport') viewports!: QueryList<ElementRef>;
  @ViewChildren('theLoai') theLoaiElements!: QueryList<ElementRef>;
  theLoai: CategoryModel[] = [];
  thinhHanhCards: EbookModel[] = [];
  headerName: string = '';
  subscriptions: Subscription[] = [];

  constructor(
    private cardService: CardService,
    private activatedRoute: ActivatedRoute,
    private store: Store<{ category: CategoryState }>,
    private renderer: Renderer2,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  ngOnInit(): void {
    this.thinhHanhCards = this.cardService.cards;
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        const type = params.get('type');
        if (type) {
          switch (type) {
            case 'history':
              this.headerName = 'Lịch sử';
              break;
            case 'trends':
              this.headerName = 'Thịnh hành';
              break;
            case 'recommend':
              this.headerName = 'Đề cử';
              break;
            case 'rank':
              this.headerName = 'Bảng xếp hạng';
              break;
          }
        }
      }),
      this.store.select('category', 'categories').subscribe((categories) => {
        if (categories.length > 0) {
          this.theLoai = categories;
        }
      }),
    );
  }

  ngAfterViewInit() {
    this.addViewportListeners();
    this.addTheLoaiListeners();
  }

  addViewportListeners() {
    this.viewports.forEach((viewport) => {
      const slider = viewport.nativeElement as HTMLElement;
      let isDown = false;
      let startX: number;
      let scrollLeft: number;
      let velocity = 0;
      let lastMoveTime: number;
      let lastMoveX: number;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        lastMoveTime = Date.now();
        lastMoveX = e.pageX;
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
      });

      slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
        applyInertia();
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.1; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;

        const now = Date.now();
        const deltaTime = now - lastMoveTime;
        const deltaX = e.pageX - lastMoveX;
        velocity = deltaX / deltaTime;

        lastMoveTime = now;
        lastMoveX = e.pageX;
      });

      function applyInertia() {
        const friction = 0.95;
        const step = () => {
          if (Math.abs(velocity) < 0.1) return;
          slider.scrollLeft -= velocity * 5;
          velocity *= friction;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    });
  }

  addTheLoaiListeners() {
    this.theLoaiElements.forEach((elementRef) => {
      const element = elementRef.nativeElement as HTMLElement;
      element.addEventListener('click', () => {
        if (element.classList.contains('selected')) {
          this.renderer.removeClass(element, 'selected');
        } else {
          this.renderer.addClass(element, 'selected');
        }
      });
    });
  }
}
