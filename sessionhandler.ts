import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class ApplicationIdleService {

    // private idle$: Observable<any>;
    private timer$;
    private timeOutMilliSeconds: number;//30 * 60 * 1000;  //30 minutes
    private idleSubscription;
    public expired$: Subject<boolean> = new Subject<boolean>();

    constructor() {

    }

    public startWatching(): Observable<any> {
        // this.idle$ = merge(
        //     fromEvent(document, 'click'),
        //     fromEvent(document, 'mousedown'),
        //     fromEvent(document, 'keypress'),
        //     fromEvent(document, 'touchmove'),
        //     fromEvent(document, 'MSPointerMove'),
        // );

        this.timeOutMilliSeconds = this.getExpiryTime();

        // this.idleSubscription = this.idle$.subscribe((res) => {
        //     this.resetTimer();
        // });

        if (+this.timeOutMilliSeconds > 0)
            this.startTimer();

        return this.expired$;
    }

    private startTimer() {
        this.timer$ = timer(this.timeOutMilliSeconds, this.timeOutMilliSeconds).subscribe((res) => {
            this.expired$.next(true);
            //this.router.navigate(['/login']);
            //this.stopTimer();
        });
    }

    public resetTimer() {
        if (this.timer$)
            this.timer$.unsubscribe();
        this.startWatching();
    }

    public stopTimer() {
        if (this.timer$)
            this.timer$.unsubscribe();

        if (this.idleSubscription)
            this.idleSubscription.unsubscribe();
    }

    private getTokenExpirationDate(token: string): Date | null {
        let decoded: any;
        decoded = this.decodeToken(token);

        if (!decoded || !decoded.hasOwnProperty('exp')) {
            return null;
        }

        const date = new Date(0);
        date.setUTCSeconds(decoded.exp);

        return date;
    }

    private decodeToken(token: string): any {
        if (token === null || token === '') {
            return null;
        }

        let parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('The inspected token doesn\'t appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more.');
        }

        let decoded = this.urlBase64Decode(parts[1]);
        if (!decoded) {
            throw new Error('Cannot decode the token.');
        }

        return JSON.parse(decoded);
    }

    private urlBase64Decode(str: string): string {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0: {
                break;
            }
            case 2: {
                output += '==';
                break;
            }
            case 3: {
                output += '=';
                break;
            }
            default: {
                throw 'Illegal base64url string!';
            }
        }
        return this.b64DecodeUnicode(output);
    }

    private b64DecodeUnicode(str: any) {
        return decodeURIComponent(
            Array.prototype.map
                .call(this.b64decode(str), (c: any) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
    }

    /* tslint:disable */
    // decoder goes to https://github.com/atk
    private b64decode(str: string): string {
        let chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output: string = '';

        str = String(str).replace(/=+$/, '');

        if (str.length % 4 === 1) {
            throw new Error(
                '\'atob\' failed: The string to be decoded is not correctly encoded.'
            );
        }

        for (
            // initialize result and counters
            let bc: number = 0, bs: any, buffer: any, idx: number = 0;
            // get next character
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
                (
                    (bs = bc % 4 ? bs * 64 + buffer : buffer),
                    // and if not first of each 4 characters,
                    // convert the first 8 bits to one ascii character
                    bc++ % 4
                )
                ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                : 0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        return output;
    }
    /* tslint:enable */

    private getExpiryTime() {

        let refreshToken = localStorage.getItem('refresh_token');
        let accessToken = localStorage.getItem('access_token');

        if (refreshToken && accessToken) {

            let refreshTokenExpiryDate: any = this.getTokenExpirationDate(refreshToken);
            //let accessTokenExpiryDate: any = this.getTokenExpirationDate(accessToken);
            let currentTime: any = new Date();

            let applicationlifeSpan = (refreshTokenExpiryDate - currentTime);

            if (applicationlifeSpan <= 0) {
                if (window.location.href.indexOf('/login') == -1)
                    this.expired$.next(true);
            } else {
                return applicationlifeSpan;
            }
            // console.log(refreshTokenExpiryDate + "" + accessTokenExpiryDate);

        } else {
            if (window.location.href.indexOf('/login') == -1)
                this.expired$.next(true);
        }
    }
}
