"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.WaterTracker = void 0;
const vscode = require("vscode");
class WaterTracker {
    constructor() {
        this.lastDrinkTime = Date.now();
        this.drinkCount = 0;
        this.isRunning = false;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "💧 Water";
        this.statusBarItem.tooltip = "Click to log water intake";
        this.statusBarItem.command = 'water-reminder.drinkNow';
        this.updateStatusBar();
    }
    start() {
        if (this.isRunning) {
            this.stopSilent();
        }
        const config = vscode.workspace.getConfiguration('waterReminder');
        const intervalMinutes = config.get('interval', 1);
        this.reminderInterval = setInterval(() => {
            this.showReminder();
        }, intervalMinutes * 60 * 1000);
        this.isRunning = true;
        this.statusBarItem.show();
        vscode.window.showInformationMessage(`💧 Water reminders started! I'll remind you every ${intervalMinutes} minutes.`);
        this.updateStatusBar();
    }
    stop() {
        this.stopSilent();
        vscode.window.showInformationMessage('💧 Water reminders stopped.');
    }
    stopSilent() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = undefined;
        }
        this.isRunning = false;
        this.statusBarItem.hide();
    }
    logDrink() {
        this.lastDrinkTime = Date.now();
        this.drinkCount++;
        this.updateStatusBar();
        vscode.window.showInformationMessage(`✅ Great! You've drank water ${this.drinkCount} times today.`, { modal: false });
        vscode.commands.executeCommand('setContext', 'waterReminder.drinkCount', this.drinkCount);
    }
    showReminder() {
        const hoursSinceLastDrink = (Date.now() - this.lastDrinkTime) / (1000 * 60 * 60);
        vscode.window.showWarningMessage(`💧 Time to drink water! It's been ${Math.round(hoursSinceLastDrink * 60)} minutes since your last drink.`, "I Drank Water", "Snooze 10 min", "Stop Reminders").then(selection => {
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
    snooze(minutes) {
        this.lastDrinkTime = Date.now();
        vscode.window.showInformationMessage(`⏸️ Reminders snoozed for ${minutes} minutes.`);
        setTimeout(() => {
            this.lastDrinkTime = Date.now() - (60 * 60 * 1000);
        }, minutes * 60 * 1000);
    }
    updateStatusBar() {
        const timeSinceLastDrink = Date.now() - this.lastDrinkTime;
        const minutes = Math.floor(timeSinceLastDrink / (1000 * 60));
        let statusText = `💧 ${this.drinkCount}`;
        if (minutes > 0) {
            statusText += ` | ${minutes}m`;
        }
        this.statusBarItem.text = statusText;
        this.statusBarItem.show();
    }
    dispose() {
        this.stopSilent();
        this.statusBarItem.dispose();
    }
}
exports.WaterTracker = WaterTracker;
let waterTracker;
function activate(context) {
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
    if (config.get('enabled', false)) {
        setTimeout(() => {
            waterTracker.start();
        }, 5000);
    }
}
exports.activate = activate;
function deactivate() {
    if (waterTracker) {
        waterTracker.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map