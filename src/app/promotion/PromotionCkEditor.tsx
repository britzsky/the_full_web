"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Alignment,
  AutoImage,
  AutoLink,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  ClassicEditor,
  CodeBlock,
  Essentials,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  Paragraph,
  SourceEditing,
  Strikethrough,
  Table,
  TableCellProperties,
  TableProperties,
  TableToolbar,
  Underline,
} from "ckeditor5";
import type { EditorConfig } from "ckeditor5";
import koTranslations from "ckeditor5/translations/ko.js";
import { useMemo } from "react";

// 홍보 화면: CKEditor 전달값
type PromotionCkEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

// 홍보 화면: CKEditor5 본문 편집기
export default function PromotionCkEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "내용을 입력해 주세요.",
}: PromotionCkEditorProps) {
  // 홍보 화면: CKEditor5 설정값
  const editorConfig = useMemo<EditorConfig>(
    () => ({
      // 홍보 화면: CKEditor5 오픈소스 라이선스 키
      licenseKey: "GPL",
      // 홍보 화면: 에디터 UI 한국어 설정
      language: "ko",
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Link,
        AutoLink,
        List,
        Indent,
        IndentBlock,
        Alignment,
        BlockQuote,
        HorizontalLine,
        CodeBlock,
        Image,
        ImageUpload,
        ImageCaption,
        ImageStyle,
        ImageToolbar,
        ImageResize,
        AutoImage,
        // 홍보 화면: 현재는 Base64 업로드를 사용하며 추후 DB 경로 업로드 어댑터로 교체 가능
        Base64UploadAdapter,
        Table,
        TableToolbar,
        TableProperties,
        TableCellProperties,
        SourceEditing,
      ],
      toolbar: {
        items: [
          "undo",
          "redo",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "|",
          "alignment",
          "|",
          "bulletedList",
          "numberedList",
          "outdent",
          "indent",
          "|",
          "link",
          "uploadImage",
          "insertTable",
          "horizontalLine",
          "blockQuote",
          "|",
          "codeBlock",
          "sourceEditing",
        ],
        shouldNotGroupWhenFull: true,
      },
      image: {
        toolbar: [
          "imageStyle:inline",
          "imageStyle:alignLeft",
          "imageStyle:alignCenter",
          "imageStyle:alignRight",
          "|",
          "imageResize",
          "|",
          "imageTextAlternative",
          "toggleImageCaption",
        ],
        styles: {
          options: ["inline", "alignLeft", "alignCenter", "alignRight"],
        },
        resizeUnit: "%",
        resizeOptions: [
          {
            name: "resizeImage:original",
            value: null,
            label: "원본",
          },
          {
            name: "resizeImage:25",
            value: "25",
            label: "25%",
          },
          {
            name: "resizeImage:50",
            value: "50",
            label: "50%",
          },
          {
            name: "resizeImage:75",
            value: "75",
            label: "75%",
          },
        ],
      },
      table: {
        contentToolbar: [
          "tableColumn",
          "tableRow",
          "mergeTableCells",
          "tableProperties",
          "tableCellProperties",
        ],
      },
      // 홍보 화면: 한글 번역 리소스 로드
      translations: [koTranslations],
      placeholder,
    }),
    [placeholder]
  );

  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      disabled={disabled}
      config={editorConfig}
      onChange={(_event, editor) => {
        onChange(editor.getData());
      }}
    />
  );
}
