"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HeroImageUploadField } from "@/components/hero-image-upload-field";
import { MultiImageUploadField } from "@/components/multi-image-upload-field";
import {
  saveTeamProfile,
  type TeamProfileFormState,
} from "@/app/dashboard/team-profile/actions";
import type { TeamImage, TeamProfile } from "@/app/types";

const initialState: TeamProfileFormState = {};

function toExistingImages(images: TeamImage[]) {
  return images.map((image) => ({
    id: image.id,
    url: image.image_url,
    caption: image.caption,
  }));
}

export function TeamProfileForm({
  teamProfile,
  trainingImages,
  priceImages,
  coachImages,
  achievementsImages,
}: {
  teamProfile: TeamProfile | null;
  trainingImages: TeamImage[];
  priceImages: TeamImage[];
  coachImages: TeamImage[];
  achievementsImages: TeamImage[];
}) {
  const [state, formAction, pending] = useActionState(
    saveTeamProfile,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <HeroImageUploadField
        name="hero_image"
        label="ヒーロー画像(トップページ紫背景)"
        currentImageUrl={teamProfile?.hero_image_url ?? null}
      />

      <HeroImageUploadField
        name="about_image"
        label="チームについて画像(「チームについて」枠内)"
        currentImageUrl={teamProfile?.about_image_url ?? null}
        previewHeightClassName="h-32"
      />

      <div className="space-y-2">
        <Label htmlFor="mission_statement">ミッション</Label>
        <Textarea
          id="mission_statement"
          name="mission_statement"
          rows={3}
          defaultValue={teamProfile?.mission_statement ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="history">沿革</Label>
        <Textarea
          id="history"
          name="history"
          rows={5}
          defaultValue={teamProfile?.history ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coaching_philosophy">指導方針</Label>
        <Textarea
          id="coaching_philosophy"
          name="coaching_philosophy"
          rows={5}
          defaultValue={teamProfile?.coaching_philosophy ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="training_info">TRAINING(練習内容)</Label>
        <Textarea
          id="training_info"
          name="training_info"
          rows={4}
          defaultValue={teamProfile?.training_info ?? ""}
        />
        <MultiImageUploadField
          name="training_image"
          label="TRAINING画像"
          currentImages={toExistingImages(trainingImages)}
          maxImages={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_info">PRICE(料金)</Label>
        <Textarea
          id="price_info"
          name="price_info"
          rows={4}
          defaultValue={teamProfile?.price_info ?? ""}
        />
        <MultiImageUploadField
          name="price_image"
          label="PRICE画像"
          currentImages={toExistingImages(priceImages)}
          maxImages={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach_info">COACH(コーチ紹介)</Label>
        <Textarea
          id="coach_info"
          name="coach_info"
          rows={4}
          defaultValue={teamProfile?.coach_info ?? ""}
        />
        <MultiImageUploadField
          name="coach_image"
          label="COACH画像"
          currentImages={toExistingImages(coachImages)}
          maxImages={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements_2021_22">2021-22実績</Label>
        <Textarea
          id="achievements_2021_22"
          name="achievements_2021_22"
          rows={4}
          defaultValue={teamProfile?.achievements_2021_22 ?? ""}
        />
        <MultiImageUploadField
          name="achievements_image"
          label="実績画像"
          currentImages={toExistingImages(achievementsImages)}
          maxImages={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">住所(ACCESS)</Label>
        <Input
          id="address"
          name="address"
          defaultValue={teamProfile?.address ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="google_maps_url">Googleマップ埋め込みURL</Label>
        <Textarea
          id="google_maps_url"
          name="google_maps_url"
          rows={3}
          placeholder='https://www.google.com/maps/embed?pb=... または <iframe src="...">...</iframe>'
          defaultValue={teamProfile?.google_maps_url ?? ""}
        />
        <p className="text-muted-foreground text-xs">
          Googleマップの「共有」→「地図を埋め込む」で表示されるURL、または
          <code>&lt;iframe&gt;</code>タグをそのまま貼り付けてください(自動でURLのみ抽出されます)。
        </p>
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs">
          {state.success ? "保存しました" : ""}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
