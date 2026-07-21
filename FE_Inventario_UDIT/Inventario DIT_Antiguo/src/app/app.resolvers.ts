import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { MessagesService } from 'app/layout/common/messages/messages.service';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { QuickChatService } from 'app/layout/common/quick-chat/quick-chat.service';
import { ShortcutsService } from 'app/layout/common/shortcuts/shortcuts.service';
import { catchError, forkJoin, of } from 'rxjs';

export const initialDataResolver = () =>
{
    const messagesService = inject(MessagesService);
    const navigationService = inject(NavigationService);
    const notificationsService = inject(NotificationsService);
    const quickChatService = inject(QuickChatService);
    const shortcutsService = inject(ShortcutsService);

    // Cada servicio protegido con catchError para que un fallo no bloquee la navegación
    return forkJoin([
        navigationService.get(),
        messagesService.getAll().pipe(catchError(() => of([]))),
        notificationsService.getAll().pipe(catchError(() => of([]))),
        quickChatService.getChats().pipe(catchError(() => of([]))),
        shortcutsService.getAll().pipe(catchError(() => of([]))),
    ]);
};
