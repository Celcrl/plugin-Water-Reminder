import * as vscode from 'vscode';

type Timer = ReturnType<typeof setInterval>;

export class WaterTracker {
    private statusBarItem: vscode.StatusBarItem;
    private reminderInterval: Timer | undefined;
    private lastDrinkTime: number = Date.now();
    private drinkCount: number = 0;
    private isRunning: boolean = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.text = "💧 Water";
        this.statusBarItem.tooltip = "Click to log water intake";
        this.statusBarItem.command = 'water-reminder.drinkNow';
        this.updateStatusBar();
    }

    public start(): void {
        if (this.isRunning) {
            this.stopSilent();
        }

        const config = vscode.workspace.getConfiguration('waterReminder');
        
        const intervalMinutes = config.get<number>('interval', 1); 
        
        this.reminderInterval = setInterval(() => {
            this.showReminder();
        }, intervalMinutes * 60 * 1000);

        this.isRunning = true;
        this.statusBarItem.show();
        
        vscode.window.showInformationMessage(
            `💧 Water reminders started! I'll remind you every ${intervalMinutes} minutes.`
        );

        this.updateStatusBar();
    }

    public stop(): void {
        this.stopSilent();
        vscode.window.showInformationMessage('💧 Water reminders stopped.');
    }

    private stopSilent(): void {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = undefined;
        }
        this.isRunning = false;
        this.statusBarItem.hide();
    }

    public logDrink(): void {
        this.lastDrinkTime = Date.now();
        this.drinkCount++;
        
        this.updateStatusBar();
        
        vscode.window.showInformationMessage(
            `✅ Great! You've drank water ${this.drinkCount} times today.`,
            { modal: false }
        );

        vscode.commands.executeCommand(
            'setContext', 
            'waterReminder.drinkCount', 
            this.drinkCount
        );
    }

    private showReminder(): void {
        const hoursSinceLastDrink = (Date.now() - this.lastDrinkTime) / (1000 * 60 * 60);
        
        vscode.window.showWarningMessage(
            `💧 Time to drink water! It's been ${Math.round(hoursSinceLastDrink * 60)} minutes since your last drink.`,
            "I Drank Water", 
            "Snooze 10 min",
            "Stop Reminders"
        ).then(selection => {
            switch (selection) {
                case "I Drank Water":
                    this.logDrink();
                    break;
                case "Snooze 10 min":
                    this.snooze(10);
                    break;
                case "Stop Reminders":
                    this.stop();
                    break;
            }
        });
    }

    private snooze(minutes: number): void {
        this.lastDrinkTime = Date.now();
        vscode.window.showInformationMessage(`⏸️ Reminders snoozed for ${minutes} minutes.`);
        
        setTimeout(() => {
            this.lastDrinkTime = Date.now() - (60 * 60 * 1000);
        }, minutes * 60 * 1000);
    }

    private updateStatusBar(): void {
        const timeSinceLastDrink = Date.now() - this.lastDrinkTime;
        const minutes = Math.floor(timeSinceLastDrink / (1000 * 60));
        
        let statusText = `💧 ${this.drinkCount}`;
        
        if (minutes > 0) {
            statusText += ` | ${minutes}m`;
        }
        
        this.statusBarItem.text = statusText;
        this.statusBarItem.show();
    }

    public dispose(): void {
        this.stopSilent();
        this.statusBarItem.dispose();
    }
}

let waterTracker: WaterTracker;

export function activate(context: vscode.ExtensionContext): void {
    waterTracker = new WaterTracker();

    const startCommand = vscode.commands.registerCommand('water-reminder.start', () => {
        waterTracker.start();
    });

    const stopCommand = vscode.commands.registerCommand('water-reminder.stop', () => {
        waterTracker.stop();
    });

    const drinkCommand = vscode.commands.registerCommand('water-reminder.drinkNow', () => {
        waterTracker.logDrink();
    });

    context.subscriptions.push(startCommand, stopCommand, drinkCommand);

    const config = vscode.workspace.getConfiguration('waterReminder');
    if (config.get<boolean>('enabled', false)) {
        setTimeout(() => {
            waterTracker.start();
        }, 5000);
    }
}

export function deactivate(): void {
    if (waterTracker) {
        waterTracker.dispose();
    }
}