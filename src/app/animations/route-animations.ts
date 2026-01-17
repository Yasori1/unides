import {
  trigger,
  transition,
  style,
  query,
  group,
  animate,
  animateChild,
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  // Community detail sayfasına geçiş - Sağdan sola
  transition('* => communityDetail', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(-15%)',
              opacity: 0.8,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),

  // Community detail'den geri dönüş - Soldan sağa
  transition('communityDetail => *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(-15%)', opacity: 0.8 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(100%)',
              opacity: 0,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),

  // Event detail sayfasına geçiş - Sağdan sola
  transition('* => eventDetail', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(-15%)',
              opacity: 0.8,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),

  // Event detail'den geri dönüş - Soldan sağa
  transition('eventDetail => *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(-15%)', opacity: 0.8 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(100%)',
              opacity: 0,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),

  // Announcement detail sayfasına geçiş - Sağdan sola
  transition('* => announcementDetail', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(-15%)',
              opacity: 0.8,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),

  // Announcement detail'den geri dönüş - Soldan sağa
  transition('announcementDetail => *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ transform: 'translateX(-15%)', opacity: 0.8 })], {
      optional: true,
    }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(
        ':leave',
        [
          animate(
            '400ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(100%)',
              opacity: 0,
            })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '500ms cubic-bezier(0.35, 0, 0.25, 1)',
            style({
              transform: 'translateX(0)',
              opacity: 1,
            })
          ),
        ],
        { optional: true }
      ),
    ]),
    query(':enter', animateChild(), { optional: true }),
  ]),
]);
