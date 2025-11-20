import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-email-compose',
    imports: [RouterLink, NgScrollbarModule, NgxEditorModule, NgIf],
    templateUrl: './email-compose.component.html',
    styleUrl: './email-compose.component.scss'
})
export class EmailComposeComponent {
    
    // Text Editor
    editor!: Editor | null;  // Make it nullable
    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['code', 'blockquote'],
        ['ordered_list', 'bullet_list'],
        [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
        ['link', 'image'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
    ];

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Initialize the editor only in the browser
            this.editor = new Editor();
        }
    }

    ngOnDestroy(): void {
        if (isPlatformBrowser(this.platformId) && this.editor) {
            this.editor.destroy();
        }
    }

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

}