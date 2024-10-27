<template>
  <div class="bg-background p-6 min-h-screen flex flex-col items-center">
    <div class="text-xl text-muted-foreground mt-12 text-center max-w-3xl">
      Welcome to the Git Summarizer. This project allows you to select the project you are working on, summarize, and create update notes for your selected commits using OpenAI's ChatGPT. You can login with your GitLab
      <i class="fa-brands fa-gitlab"></i> and GitHub <i class="fa-brands fa-github"></i> accounts.
    </div>

    <div class="mt-16 flex flex-col items-center w-full">
      <div class="w-full md:w-3/4 lg:w-1/2 bg-card p-8 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-6">How It Works</h2>
        <Accordion type="single" class="w-full" collapsible default-value="step1">
          <AccordionItem value="step1">
            <AccordionTrigger>Step 1: Login</AccordionTrigger>
            <AccordionContent>To begin, click on the login button for either GitLab or GitHub. This allows the Git Commit Summarizer to access your projects and provide commit summaries based on your selected repositories.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step2">
            <AccordionTrigger>Step 2: Select Your Project</AccordionTrigger>
            <AccordionContent>After logging in, you'll see a list of your projects. Select the project for which you want to summarize commits. This helps the summarizer focus on the specific project you're working on.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step3">
            <AccordionTrigger>Step 3: Choose Commits to Summarize</AccordionTrigger>
            <AccordionContent>Select the specific commits you want summarized. You can choose multiple commits to get an overview of the changes made, which is especially useful for preparing release notes or update descriptions.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step4">
            <AccordionTrigger>Step 4: Generate and Review Notes</AccordionTrigger>
            <AccordionContent>Click the 'Generate Notes' button to create concise update notes for the selected commits. The notes are generated using OpenAI's ChatGPT, ensuring they are informative and easy to understand. Review and edit the generated notes before copying them.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>

    <footer class="mt-auto py-4 w-full bg-primary text-primary-foreground text-center">
      <p>&copy; 2024 Git Commit Summarizer. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '../components/ui/accordion'
</script>
