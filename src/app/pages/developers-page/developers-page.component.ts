import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { AvatarGroupComponent, AvatarUser } from '../../components/ui/avatar-group/avatar-group';
import { ProfileCardComponent } from '../../components/ui/profile-card/profile-card';
import { WavesComponent } from '../../components/ui/waves/waves';

interface Developer {
  name: string;
  title: string;
  image: string;
  handle: string;
  status: string;
  contactText: string;
}

@Component({
  selector: 'app-developers-page',
  standalone: true,
  imports: [
    CommonModule,
    SiteNavbarComponent,
    SiteFooterComponent,
    AvatarGroupComponent,
    ProfileCardComponent,
    WavesComponent,
  ],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Bu satır 'spline-viewer' hatasını çözer
})
export class DevelopersPageComponent implements OnInit {
  // Lider Kadro
  leadDevelopers: AvatarUser[] = [
    {
      name: 'Safa G.',
      role: 'Lead Architect',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      name: 'Elif Y.',
      role: 'Product Manager',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      name: 'Caner K.',
      role: 'Senior Backend',
      image: 'https://randomuser.me/api/portraits/men/86.jpg',
    },
    {
      name: 'Zeynep S.',
      role: 'Senior Frontend',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    {
      name: 'Murat D.',
      role: 'DevOps Engineer',
      image: 'https://randomuser.me/api/portraits/men/46.jpg',
    },
  ];

  // Geliştiriciler
  developers: Developer[] = [
    {
      name: 'Safa G.',
      title: 'Lead Architect',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      handle: 'safa_arch',
      status: 'Coding',
      contactText: 'Follow',
    },
    {
      name: 'Elif Y.',
      title: 'Product Manager',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      handle: 'elif_pm',
      status: 'In Meeting',
      contactText: 'Connect',
    },
    {
      name: 'Caner K.',
      title: 'Senior Backend',
      image: 'https://randomuser.me/api/portraits/men/86.jpg',
      handle: 'caner_dev',
      status: 'Deploying',
      contactText: 'Message',
    },
    {
      name: 'Zeynep S.',
      title: 'Senior Frontend',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
      handle: 'zeynep_ui',
      status: 'Designing',
      contactText: 'Follow',
    },
    {
      name: 'Murat D.',
      title: 'DevOps Engineer',
      image: 'https://randomuser.me/api/portraits/men/46.jpg',
      handle: 'murat_ops',
      status: 'Offline',
      contactText: 'Email',
    },
    {
      name: 'Ayşe T.',
      title: 'UI/UX Designer',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
      handle: 'ayse_design',
      status: 'Online',
      contactText: 'Dribbble',
    },
    {
      name: 'Burak Y.',
      title: 'Backend Developer',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      handle: 'burak_api',
      status: 'Away',
      contactText: 'GitHub',
    },
    {
      name: 'Selin D.',
      title: 'Frontend Developer',
      image: 'https://randomuser.me/api/portraits/women/90.jpg',
      handle: 'selin_fe',
      status: 'Coding',
      contactText: 'Follow',
    },
    {
      name: 'Oğuzhan K.',
      title: 'Mobile Developer',
      image: 'https://randomuser.me/api/portraits/men/11.jpg',
      handle: 'oguz_mob',
      status: 'Testing',
      contactText: 'Contact',
    },
    {
      name: 'Fatma A.',
      title: 'QA Engineer',
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      handle: 'fatma_qa',
      status: 'Bug Hunting',
      contactText: 'Report',
    },
    {
      name: 'Emre V.',
      title: 'Full Stack',
      image: 'https://randomuser.me/api/portraits/men/33.jpg',
      handle: 'emre_fs',
      status: 'Online',
      contactText: 'Connect',
    },
    {
      name: 'Gamze Ö.',
      title: 'Data Scientist',
      image: 'https://randomuser.me/api/portraits/women/45.jpg',
      handle: 'gamze_data',
      status: 'Analyzing',
      contactText: 'Follow',
    },
    {
      name: 'Hakan Ç.',
      title: 'Security',
      image: 'https://randomuser.me/api/portraits/men/55.jpg',
      handle: 'hakan_sec',
      status: 'Auditing',
      contactText: 'Secure',
    },
    {
      name: 'İrem B.',
      title: 'Content Strategist',
      image: 'https://randomuser.me/api/portraits/women/66.jpg',
      handle: 'irem_cont',
      status: 'Writing',
      contactText: 'Read',
    },
    {
      name: 'Kaan L.',
      title: 'Frontend Developer',
      image: 'https://randomuser.me/api/portraits/men/77.jpg',
      handle: 'kaan_js',
      status: 'Debugging',
      contactText: 'Follow',
    },
    {
      name: 'Leyla M.',
      title: 'Backend Developer',
      image: 'https://randomuser.me/api/portraits/women/88.jpg',
      handle: 'leyla_py',
      status: 'Online',
      contactText: 'Connect',
    },
    {
      name: 'Mert N.',
      title: 'Intern',
      image: 'https://randomuser.me/api/portraits/men/99.jpg',
      handle: 'mert_int',
      status: 'Learning',
      contactText: 'Support',
    },
    {
      name: 'Nazlı P.',
      title: 'Intern',
      image: 'https://randomuser.me/api/portraits/women/29.jpg',
      handle: 'nazli_int',
      status: 'Online',
      contactText: 'Connect',
    },
    {
      name: 'Osman R.',
      title: 'Cloud Architect',
      image: 'https://randomuser.me/api/portraits/men/39.jpg',
      handle: 'osman_cloud',
      status: 'Scaling',
      contactText: 'Contact',
    },
    {
      name: 'Pelin S.',
      title: 'Community Manager',
      image: 'https://randomuser.me/api/portraits/women/59.jpg',
      handle: 'pelin_cm',
      status: 'Online',
      contactText: 'Join',
    },
  ];

  ngOnInit(): void {
    // Spline scriptinin yüklenip yüklenmediğini kontrol et
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }
}
