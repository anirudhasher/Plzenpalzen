"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OpenAI Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600">OpenAI Platform</a>
              </p>
            </div>
            
            <Button 
              onClick={saveSettings}
              className={saved ? 'bg-green-500 hover:bg-green-600' : ''}
              disabled={!apiKey.trim()}
            >
              {saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}